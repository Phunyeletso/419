use anchor_lang::prelude::*;
use anchor_lang::solana_program::{
    clock::Clock, 
    program::invoke_signed,
    program::invoke,  
    system_instruction
};

declare_id!("FP3cFkwHy5hzDTw3LRWYdDgiEBD4yxPqT49uaLDB56fD");

#[program]
pub mod ludo_game {
    use super::*;

    /// Initialize a new Ludo game.
    pub fn initialize_game(
        ctx: Context<InitializeGame>,
        max_players: u8,
        bet_amount: u64,
        game_seed: String,
    ) -> Result<()> {
        require!(
            max_players == 2 || max_players == 4,
            ErrorCode::InvalidPlayerCount
        );
        require!(bet_amount > 0, ErrorCode::InvalidBetAmount);

        let game = &mut ctx.accounts.game;
        let creator = ctx.accounts.creator.key();
        let bump = ctx.bumps.game;

        game.creator = creator;
        game.players = vec![creator];
        game.max_players = max_players;
        game.bet_amount = bet_amount;
        game.total_bet = bet_amount; // Only count deposited bet amount
        game.platform_fee = bet_amount / 10; // 10% fee
        game.prize_pool = bet_amount - game.platform_fee;
        game.track_length = 56; // Standard Ludo has 52 common squares + 6 home squares - 1 (starting at 0) = 57
        game.positions = vec![vec![0; 4]]; // Each player has 4 pieces
        game.home_counts = vec![0]; // Count of pieces that reached home
        game.seed = game_seed;
        game.bump = bump;

        // Setup board coordinates based on player count
        if max_players == 4 {
            game.start_offsets = vec![0, 13, 26, 39]; // Starting positions for each player
            game.home_entry_positions = vec![50, 11, 24, 37]; // Position before home path entry
        } else {
            game.start_offsets = vec![0, 26]; // For 2 players, positions opposite to each other
            game.home_entry_positions = vec![50, 24];
        }

        // Safe zones (star positions) in standard Ludo
        game.safe_zones = vec![8, 13, 21, 26, 34, 39, 47];

        game.turn = 0;
        game.last_move_time = Clock::get()?.unix_timestamp;
        game.winner = None;
        game.second_place = None;
        game.game_state = GameStatus::WaitingForPlayers;
        game.dice_roll = None;
        game.consecutive_sixes = 0; // Track consecutive sixes for standard rule
        game.missed_turns = vec![0];
        game.deposited_players = vec![creator];

        // Transfer bet amount from creator to game account
        let transfer_instruction = system_instruction::transfer(
            &ctx.accounts.creator.key(),
            &ctx.accounts.game.key(),
            bet_amount,
        );

        invoke(
            &transfer_instruction,
            &[
                ctx.accounts.creator.to_account_info().clone(),
                ctx.accounts.game.to_account_info().clone(),
                ctx.accounts.system_program.to_account_info().clone(),
            ],
        )?;

        Ok(())
    }

    /// Join an existing game.
    pub fn join_game(ctx: Context<JoinGame>) -> Result<()> {
        let player = ctx.accounts.player.key();
        let game_key = ctx.accounts.game.key();
        let bet_amount = ctx.accounts.game.bet_amount;
        
        require!(
            ctx.accounts.game.game_state == GameStatus::WaitingForPlayers,
            ErrorCode::GameAlreadyStarted
        );
        require!(
            (ctx.accounts.game.players.len() as u8) < ctx.accounts.game.max_players,
            ErrorCode::GameFull
        );
        require!(!ctx.accounts.game.players.contains(&player), ErrorCode::AlreadyJoined);

        // Transfer bet amount from player to game account
        let transfer_instruction = system_instruction::transfer(
            &ctx.accounts.player.key(),
            &game_key,
            bet_amount,
        );

        invoke(
            &transfer_instruction,
            &[
                ctx.accounts.player.to_account_info().clone(),
                ctx.accounts.game.to_account_info().clone(),
                ctx.accounts.system_program.to_account_info().clone(),
            ],
        )?;
        
        let game = &mut ctx.accounts.game;
        game.players.push(player);
        game.deposited_players.push(player);
        game.positions.push(vec![0; 4]);
        game.home_counts.push(0);
        game.missed_turns.push(0);
        game.total_bet += game.bet_amount;
        game.prize_pool = game.total_bet - (game.total_bet / 10);

        if (game.players.len() as u8) == game.max_players {
            game.game_state = GameStatus::Active;
            game.last_move_time = Clock::get()?.unix_timestamp;
        }

        Ok(())
    }

    /// Simple dice roll (without Switchboard VRF).
    pub fn request_randomness(ctx: Context<SimpleRandomness>) -> Result<()> {
        let game = &mut ctx.accounts.game;
        require!(
            game.game_state == GameStatus::Active,
            ErrorCode::GameNotActive
        );
        require!(
            ctx.accounts.player.key() == game.players[game.turn as usize],
            ErrorCode::NotYourTurn
        );

        let clock = Clock::get()?;
        if clock.unix_timestamp - game.last_move_time > 60 {
            let turn = game.turn;
            game.missed_turns[turn as usize] += 1;
            msg!("Player {} missed their turn!", turn);

            if game.missed_turns[turn as usize] >= 3 {
                msg!("Player {} removed due to inactivity", turn);
                // Mark player as inactive but keep their position in the array
                game.players[turn as usize] = Pubkey::default();

                let active_players: Vec<&Pubkey> = game
                    .players
                    .iter()
                    .filter(|&&p| p != Pubkey::default())
                    .collect();
                if active_players.len() == 1 {
                    msg!("Only one player left, ending game.");
                    game.winner = Some(*active_players[0]);
                    game.game_state = GameStatus::Completed;
                    return Ok(());
                }
            }
            game.consecutive_sixes = 0; // Reset consecutive sixes count
            game.turn = next_active_player(game, game.turn);
            return Err(ErrorCode::TurnSkipped.into());
        }

        // Simple dice roll using slot and timestamp as randomness source (for testing)
        let slot = clock.slot;
        let timestamp = clock.unix_timestamp;
        let random_value = ((slot as u64).wrapping_mul(timestamp as u64) % 6) as u8 + 1;
        msg!("Player {} rolled a {}", game.turn, random_value);

        // Track consecutive sixes (standard Ludo rule)
        if random_value == 6 {
            game.consecutive_sixes += 1;
            if game.consecutive_sixes >= 3 {
                msg!(
                    "Player {} rolled three consecutive sixes, turn is forfeited",
                    game.turn
                );
                game.consecutive_sixes = 0;
                game.turn = next_active_player(game, game.turn);
                game.last_move_time = clock.unix_timestamp;
                return Ok(());
            }
        } else {
            game.consecutive_sixes = 0;
        }

        game.dice_roll = Some(random_value);
        game.last_move_time = clock.unix_timestamp;

        Ok(())
    }

    /// Move one of the player's pieces based on the last dice roll.
    pub fn move_piece(ctx: Context<MovePiece>, piece_index: u8) -> Result<()> {
        let game = &mut ctx.accounts.game;
        require!(
            game.game_state == GameStatus::Active,
            ErrorCode::GameNotActive
        );

        let current_player = game.turn as usize;
        require!(
            ctx.accounts.player.key() == game.players[current_player],
            ErrorCode::NotYourTurn
        );
        require!((piece_index as usize) < 4, ErrorCode::InvalidPiece);

        let dice_value = game.dice_roll.ok_or(ErrorCode::DiceNotRolled)?;
        let current_pos = game.positions[current_player][piece_index as usize];

        // Check if player has any valid moves
        let has_valid_move = check_for_valid_moves(game, current_player, dice_value);
        require!(has_valid_move, ErrorCode::NoValidMoves);

        // Handle piece movement logic based on standard Ludo rules
        if current_pos == 0 {
            // Can only move piece out of home yard with a 6
            if dice_value != 6 {
                return Err(ErrorCode::CannotStart.into());
            }
            // Start piece from base at the player's starting position
            game.positions[current_player][piece_index as usize] = 1;
            msg!(
                "Player {} started piece {} with a 6",
                current_player,
                piece_index
            );
        } else {
            // Calculate new position
            let new_pos = current_pos + dice_value;

            // Check if piece is entering home stretch
            let home_entry = game.home_entry_positions[current_player];

            if current_pos <= home_entry && new_pos > home_entry {
                // Piece is entering home path
                let home_steps = new_pos - home_entry;

                // Verify home path position is valid (not overshooting)
                if home_steps > 6 {
                    return Err(ErrorCode::InvalidMove.into());
                }

                // Set position into home section (51-56 range for home path)
                let home_position = 50 + home_steps;
                game.positions[current_player][piece_index as usize] = home_position;

                // Check if piece reached home (position 56)
                if home_position == 56 {
                    msg!(
                        "Player {}'s piece {} reached home!",
                        current_player,
                        piece_index
                    );
                    game.home_counts[current_player] += 1;

                    // Check if all 4 pieces are home
                    if game.home_counts[current_player] == 4 {
                        msg!("Player {} finished all pieces!", current_player);
                        if game.max_players == 2 {
                            game.winner = Some(ctx.accounts.player.key());
                            game.game_state = GameStatus::Completed;
                        } else {
                            if game.winner.is_none() {
                                game.winner = Some(ctx.accounts.player.key());
                            } else if game.second_place.is_none()
                                && game.winner.unwrap() != ctx.accounts.player.key()
                            {
                                game.second_place = Some(ctx.accounts.player.key());
                                game.game_state = GameStatus::Completed;
                            }
                        }
                    }
                }
            } else if new_pos > 50 {
                // Regular movement but would exceed track length
                return Err(ErrorCode::InvalidMove.into());
            } else {
                // Regular movement on main track
                game.positions[current_player][piece_index as usize] = new_pos;
                msg!(
                    "Player {} moved piece {} from {} to {}",
                    current_player,
                    piece_index,
                    current_pos,
                    new_pos
                );

                // Handle capture logic
                let player_offset = game.start_offsets[current_player];
                let absolute_pos = (player_offset + new_pos) % 52;

                if !game.safe_zones.contains(&absolute_pos) {
                    for opp_index in 0..game.players.len() {
                        if opp_index == current_player
                            || game.players[opp_index] == Pubkey::default()
                        {
                            continue;
                        }

                        let opp_offset = game.start_offsets[opp_index];
                        for opp_piece_idx in 0..4 {
                            let opp_pos = game.positions[opp_index][opp_piece_idx];
                            if opp_pos > 0 && opp_pos <= 50 {
                                // Only pieces on main track can be captured
                                let opp_abs = (opp_offset + opp_pos) % 52;
                                if opp_abs == absolute_pos {
                                    msg!(
                                        "Player {}'s piece captured opponent {}'s piece {}",
                                        current_player,
                                        opp_index,
                                        opp_piece_idx
                                    );
                                    game.positions[opp_index][opp_piece_idx] = 0;
                                    // Reset to home yard
                                }
                            }
                        }
                    }
                }
            }
        }

        // Update turn - player gets another turn if rolled a 6 (unless 3 sixes in a row)
        if dice_value != 6 && game.game_state == GameStatus::Active {
            game.turn = next_active_player(game, game.turn);
        }

        game.dice_roll = None;
        game.last_move_time = Clock::get()?.unix_timestamp;
        Ok(())
    }

    /// Distribute prizes to winners
    pub fn distribute_prizes(ctx: Context<DistributePrizes>) -> Result<()> {
        // Gather all required values upfront
        let game_state = ctx.accounts.game.game_state;
        let seed = ctx.accounts.game.seed.clone();
        let bump = ctx.accounts.game.bump;
        let game_key = ctx.accounts.game.key();
        let platform_key = ctx.accounts.platform.key();
        let total_bet = ctx.accounts.game.total_bet;
        let max_players = ctx.accounts.game.max_players;
        let platform_fee = total_bet / 10;
        
        // Get winner info before mutable borrow
        let winner_opt = ctx.accounts.game.winner;
        let second_place_opt = ctx.accounts.game.second_place;
        
        // Clone account infos
        let game_acct_info = ctx.accounts.game.to_account_info().clone();
        let platform_acct_info = ctx.accounts.platform.to_account_info().clone();
        let system_program_info = ctx.accounts.system_program.to_account_info().clone();
        
        require!(
            game_state == GameStatus::Completed,
            ErrorCode::GameNotCompleted
        );

        let seeds = [b"game".as_ref(), seed.as_bytes(), &[bump]];
        let signer = &[&seeds[..]];

        // Transfer platform fee
        invoke_signed(
            &system_instruction::transfer(&game_key, &platform_key, platform_fee),
            &[
                game_acct_info.clone(),
                platform_acct_info,
                system_program_info.clone(),
            ],
            signer,
        )?;
        
        // Distribute prizes based on game mode
        if max_players == 2 {
            let winner = winner_opt.ok_or(ErrorCode::NoWinner)?;
            let winner_amount = total_bet - platform_fee;

            invoke_signed(
                &system_instruction::transfer(&game_key, &winner, winner_amount),
                &[
                    game_acct_info.clone(),
                    system_program_info.clone(),
                ],
                signer,
            )?;
        } else {
            let first_place = winner_opt.ok_or(ErrorCode::NoWinner)?;
            let second_place = second_place_opt.ok_or(ErrorCode::NoSecondPlace)?;

            let first_amount = (total_bet * 65) / 100;
            let second_amount = (total_bet * 25) / 100;

            invoke_signed(
                &system_instruction::transfer(&game_key, &first_place, first_amount),
                &[
                    game_acct_info.clone(),
                    system_program_info.clone(),
                ],
                signer,
            )?;

            invoke_signed(
                &system_instruction::transfer(&game_key, &second_place, second_amount),
                &[
                    game_acct_info.clone(),
                    system_program_info.clone(),
                ],
                signer,
            )?;
        }

        // Now we can safely mutate the game state
        let game = &mut ctx.accounts.game;
        game.game_state = GameStatus::Finalized;
        Ok(())
    }

    /// Cancel a game that hasn't started yet and refund players
    pub fn cancel_game(ctx: Context<CancelGame>) -> Result<()> {
        require!(
            ctx.accounts.game.game_state == GameStatus::WaitingForPlayers,
            ErrorCode::GameAlreadyStarted
        );
        require!(
            ctx.accounts.creator.key() == ctx.accounts.game.creator,
            ErrorCode::NotGameCreator
        );

        let seeds = [b"game".as_ref(), ctx.accounts.game.seed.as_bytes(), &[ctx.accounts.game.bump]];
        let signer = &[&seeds[..]];
        let game_key = ctx.accounts.game.key();
        let bet_amount = ctx.accounts.game.bet_amount;
        let deposited_players = ctx.accounts.game.deposited_players.clone();
        let game_acct_info = ctx.accounts.game.to_account_info().clone();
        let system_program_info = ctx.accounts.system_program.to_account_info().clone();

        // Refund all players
        for player in &deposited_players {
            invoke_signed(
                &system_instruction::transfer(&game_key, player, bet_amount),
                &[
                    game_acct_info.clone(),
                    system_program_info.clone(),
                ],
                signer,
            )?;
        }

        let game = &mut ctx.accounts.game;
        game.game_state = GameStatus::Cancelled;
        Ok(())
    }
}

/// Helper function to find the next active player
fn next_active_player(game: &GameState, current_turn: u8) -> u8 {
    let mut next_turn = (current_turn as usize + 1) % game.players.len();

    // Find the next non-default player
    while game.players[next_turn] == Pubkey::default() {
        next_turn = (next_turn + 1) % game.players.len();
    }

    next_turn as u8
}

/// Helper function to check if player has any valid moves with current dice roll
fn check_for_valid_moves(game: &GameState, player_idx: usize, dice_value: u8) -> bool {
    // If player rolled a 6, they can always move a piece out from home yard
    if dice_value == 6 {
        for pos in &game.positions[player_idx] {
            if *pos == 0 {
                return true;
            }
        }
    }

    // Check if any piece on the board can move
    let home_entry = game.home_entry_positions[player_idx];

    for pos in &game.positions[player_idx] {
        if *pos > 0 && *pos < 56 {
            // Piece is on the board but not home yet
            let new_pos = *pos + dice_value;

            // Check if move is valid based on home entry logic
            if *pos <= home_entry && new_pos > home_entry {
                let home_steps = new_pos - home_entry;
                if home_steps <= 6 {
                    // Valid home path move
                    return true;
                }
            } else if new_pos <= 50 {
                // Valid main track move
                return true;
            }
        }
    }

    false // No valid moves found
}

#[derive(Accounts)]
#[instruction(max_players: u8, bet_amount: u64, game_seed: String)]
pub struct InitializeGame<'info> {
    #[account(
        init,
        payer = creator,
        space = 8 + GameState::INIT_SPACE,
        seeds = [b"game".as_ref(), game_seed.as_bytes()],
        bump
    )]
    pub game: Account<'info, GameState>,
    #[account(mut)]
    pub creator: Signer<'info>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

#[derive(Accounts)]
pub struct JoinGame<'info> {
    #[account(mut)]
    pub game: Account<'info, GameState>,
    #[account(mut)]
    pub player: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct SimpleRandomness<'info> {
    #[account(mut)]
    pub game: Account<'info, GameState>,
    #[account(mut)]
    pub player: Signer<'info>,
}

#[derive(Accounts)]
pub struct MovePiece<'info> {
    #[account(mut)]
    pub game: Account<'info, GameState>,
    #[account(mut)]
    pub player: Signer<'info>,
}

#[derive(Accounts)]
pub struct DistributePrizes<'info> {
    #[account(mut)]
    pub game: Account<'info, GameState>,
    /// CHECK: This is the platform fee recipient
    #[account(mut)]
    pub platform: UncheckedAccount<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct CancelGame<'info> {
    #[account(mut)]
    pub game: Account<'info, GameState>,
    #[account(mut)]
    pub creator: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[account]
pub struct GameState {
    pub creator: Pubkey,
    pub players: Vec<Pubkey>,
    pub deposited_players: Vec<Pubkey>,
    pub max_players: u8,
    pub bet_amount: u64,
    pub total_bet: u64,
    pub platform_fee: u64,
    pub prize_pool: u64,
    pub track_length: u8,
    pub positions: Vec<Vec<u8>>,
    pub home_counts: Vec<u8>, // Track how many pieces each player has at home
    pub start_offsets: Vec<u8>,
    pub home_entry_positions: Vec<u8>, // Position right before home path entry
    pub safe_zones: Vec<u8>,
    pub turn: u8,
    pub last_move_time: i64,
    pub winner: Option<Pubkey>,
    pub second_place: Option<Pubkey>,
    pub game_state: GameStatus,
    pub dice_roll: Option<u8>,
    pub consecutive_sixes: u8, // Track consecutive sixes for standard Ludo rule
    pub missed_turns: Vec<u8>,
    pub randomness_requested: bool,
    pub seed: String,
    pub bump: u8,
}

impl GameState {
    pub const INIT_SPACE: usize = 32 +                                        // creator
        (32 * 10) +                                 // players (vec with max 10 elements)
        (32 * 10) +                                 // deposited_players (vec with max 10 elements)
        1 +                                         // max_players
        8 +                                         // bet_amount
        8 +                                         // total_bet
        8 +                                         // platform_fee
        8 +                                         // prize_pool
        1 +                                         // track_length
        (10 * (4 * 1)) +                            // positions (vec of vec with max 10 players * 4 pieces)
        (10 * 1) +                                  // home_counts (vec with max 10 players)
        (4 * 1) +                                   // start_offsets (vec with max 4 elements)
        (4 * 1) +                                   // home_entry_positions (vec with max 4 elements)
        (8 * 1) +                                   // safe_zones (vec with max 8 elements)
        1 +                                         // turn
        8 +                                         // last_move_time
        (1 + 32) +                                  // winner (Option<Pubkey>)
        (1 + 32) +                                  // second_place (Option<Pubkey>)
        1 +                                         // game_state
        (1 + 1) +                                   // dice_roll (Option<u8>)
        1 +                                         // consecutive_sixes
        (10 * 1) +                                  // missed_turns (vec with max 10 elements)
        1 +                                         // randomness_requested
        (4 + 32) +                                  // seed (String with max 32 chars)
        1 +                                         // bump
        200; // padding for future use
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq)]
pub enum GameStatus {
    WaitingForPlayers,
    Active,
    Completed,
    Finalized,
    Cancelled,
}

#[error_code]
pub enum ErrorCode {
    #[msg("Invalid number of players. Must be 2 or 4.")]
    InvalidPlayerCount,
    #[msg("Invalid bet amount. Must be greater than 0.")]
    InvalidBetAmount,
    #[msg("It's not your turn.")]
    NotYourTurn,
    #[msg("Game is not active.")]
    GameNotActive,
    #[msg("Game has already ended.")]
    GameOver,
    #[msg("Invalid piece index.")]
    InvalidPiece,
    #[msg("Dice has not been rolled yet.")]
    DiceNotRolled,
    #[msg("Turn skipped due to inactivity.")]
    TurnSkipped,
    #[msg("Cannot move piece from base without rolling a six.")]
    CannotStart,
    #[msg("Invalid move: dice roll exceeds required steps.")]
    InvalidMove,
    #[msg("Game is not completed yet.")]
    GameNotCompleted,
    #[msg("No winner found.")]
    NoWinner,
    #[msg("No second place found.")]
    NoSecondPlace,
    #[msg("Game has already started.")]
    GameAlreadyStarted,
    #[msg("Game is full.")]
    GameFull,
    #[msg("You have already joined this game.")]
    AlreadyJoined,
    #[msg("Only the game creator can cancel the game.")]
    NotGameCreator,
    #[msg("Randomness has not been requested.")]
    RandomnessNotRequested,
    #[msg("Insufficient randomness from VRF.")]
    InsufficientRandomness,
    #[msg("No valid moves available with current dice roll.")]
    NoValidMoves,
}
