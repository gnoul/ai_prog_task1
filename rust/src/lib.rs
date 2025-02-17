use wasm_bindgen::prelude::*;
use web_sys::{CanvasRenderingContext2d, HtmlCanvasElement};
use js_sys::Math;
mod constants;
use constants::{SHAPES, CLASSIC_COLORS, PASTEL_COLORS, NEON_COLORS, BACKGROUNDS, COLS, ROWS, BLOCK_SIZE};

// Структуры данных
#[wasm_bindgen]
pub struct Game {
    ctx: CanvasRenderingContext2d,
    board: Vec<Vec<Option<String>>>,
    current_piece: Piece,
    score: u32,
    lines: u32,
    level: u32,
    drop_interval: f64,
    last_time: f64,
    drop_counter: f64,
    game_over: bool,
    is_playing: bool,
    is_paused: bool,
    current_colors: [String; 7],
    high_score: u32,
}

struct Piece {
    matrix: Vec<Vec<bool>>,
    color: String,
    pos: Position,
    shape_idx: usize,
}

struct Position {
    x: i32,
    y: i32,
}

// Реализация игры
#[wasm_bindgen]
impl Game {
    #[wasm_bindgen(constructor)]
    pub fn new() -> Result<Game, JsValue> {
        let document = web_sys::window().unwrap().document().unwrap();
        let canvas = document.get_element_by_id("board")
            .unwrap()
            .dyn_into::<HtmlCanvasElement>()?;
        
        let ctx = canvas.get_context("2d")?
            .unwrap()
            .dyn_into::<CanvasRenderingContext2d>()?;

        // Настройка canvas
        canvas.set_width(COLS as u32 * BLOCK_SIZE);
        canvas.set_height(ROWS as u32 * BLOCK_SIZE);
        
        // Загружаем сохраненные настройки
        let window = web_sys::window().unwrap();
        let storage = window.local_storage().unwrap().unwrap();
        
        // Загружаем цветовую схему
        let color_scheme = storage.get_item("colorScheme").unwrap().unwrap_or("classic".to_string());
        let current_colors = match color_scheme.as_str() {
            "pastel" => PASTEL_COLORS,
            "neon" => NEON_COLORS,
            _ => CLASSIC_COLORS,
        }.map(|c| c.to_string());

        // Загружаем цвет фона
        if let Some(bg_color) = storage.get_item("backgroundColor").unwrap() {
            let element = document.body().unwrap();
            element.set_attribute("style", &format!("background-color: {};", bg_color))?;
        }

        // Загружаем фоновое изображение
        if let Some(bg_image) = storage.get_item("backgroundImage").unwrap() {
            let element = document.body().unwrap();
            element.set_attribute("style", &format!("background-image: url('{}');", bg_image))?;
        }

        // Загружаем рекорд
        let high_score = if let Some(score) = storage.get_item("highScore").unwrap() {
            score.parse().unwrap_or(0)
        } else {
            0
        };

        // Обновляем элемент рекорда на странице
        let highscore_element = document.get_element_by_id("highscore").unwrap();
        highscore_element.set_text_content(Some(&high_score.to_string()));

        Ok(Game {
            ctx,
            board: vec![vec![None; COLS]; ROWS],
            current_piece: Piece::new(&CLASSIC_COLORS),
            score: 0,
            lines: 0,
            level: 1,
            drop_interval: 1000.0,
            last_time: 0.0,
            drop_counter: 0.0,
            game_over: false,
            is_playing: false,
            is_paused: false,
            current_colors,
            high_score,
        })
    }

    pub fn draw(&self) {
        // Очистка поля
        self.ctx.set_fill_style_str("#000");
        self.ctx.fill_rect(0.0, 0.0, 
            (COLS * BLOCK_SIZE as usize) as f64, 
            (ROWS * BLOCK_SIZE as usize) as f64);

        // Отрисовка доски
        self.draw_board();
        
        // Отрисовка текущей фигуры
        self.draw_piece();
    }

    fn draw_board(&self) {
        for (y, row) in self.board.iter().enumerate() {
            for (x, cell) in row.iter().enumerate() {
                if let Some(color) = cell {
                    self.draw_block(x as i32, y as i32, color);
                }
            }
        }
    }

    fn draw_piece(&self) {
        for (y, row) in self.current_piece.matrix.iter().enumerate() {
            for (x, &is_set) in row.iter().enumerate() {
                if is_set {
                    self.draw_block(
                        self.current_piece.pos.x + x as i32,
                        self.current_piece.pos.y + y as i32,
                        &self.current_piece.color
                    );
                }
            }
        }
    }

    fn draw_block(&self, x: i32, y: i32, color: &str) {
        self.ctx.set_fill_style_str(color);
        self.ctx.fill_rect(
            (x * BLOCK_SIZE as i32) as f64,
            (y * BLOCK_SIZE as i32) as f64,
            BLOCK_SIZE as f64,
            BLOCK_SIZE as f64
        );
        
        // Добавляем рамку
        self.ctx.set_stroke_style_str("rgba(255, 255, 255, 0.5)");
        self.ctx.stroke_rect(
            (x * BLOCK_SIZE as i32) as f64,
            (y * BLOCK_SIZE as i32) as f64,
            BLOCK_SIZE as f64,
            BLOCK_SIZE as f64
        );
    }

    pub fn play(&mut self) {
        // Сброс игры
        self.board = vec![vec![None; COLS]; ROWS];
        self.score = 0;
        self.lines = 0;
        self.level = 1;
        self.drop_interval = 1000.0;
        self.last_time = 0.0;
        self.drop_counter = 0.0;
        self.game_over = false;
        self.is_playing = true;
        self.is_paused = false;
        self.current_piece = Piece::new(&CLASSIC_COLORS);

        // Скрываем сообщение о завершении игры
        let window = web_sys::window().unwrap();
        let document = window.document().unwrap();
        let game_over_element = document.get_element_by_id("game-over").unwrap();
        game_over_element.set_attribute("style", "display: none;").unwrap();
    }

    pub fn update(&mut self, time: f64) {
        if !self.is_playing || self.is_paused || self.game_over {
            return;
        }

        let delta = time - self.last_time;
        self.last_time = time;
        self.drop_counter += delta;

        if self.drop_counter > self.drop_interval {
            self.drop_counter = 0.0;
            self.move_down();
        }
    }

    pub fn toggle_pause(&mut self) {
        if self.is_playing && !self.game_over {
            self.is_paused = !self.is_paused;
        }
    }

    pub fn is_paused(&self) -> bool {
        self.is_paused
    }

    pub fn is_game_over(&self) -> bool {
        self.game_over
    }

    pub fn handle_key(&mut self, key: &str) {
        if !self.is_playing || self.is_paused {
            return;
        }

        match key {
            "ArrowLeft" => self.move_left(),
            "ArrowRight" => self.move_right(),
            "ArrowDown" => self.move_down(),
            "ArrowUp" => self.rotate(),
            "Space" => self.hard_drop(),
            _ => (),
        }
    }

    // Добавьте методы для движения фигуры
    fn move_left(&mut self) {
        self.current_piece.pos.x -= 1;
        if self.collide() {
            self.current_piece.pos.x += 1;
        }
    }

    fn move_right(&mut self) {
        self.current_piece.pos.x += 1;
        if self.collide() {
            self.current_piece.pos.x -= 1;
        }
    }

    fn move_down(&mut self) {
        self.current_piece.pos.y += 1;
        if self.collide() {
            self.current_piece.pos.y -= 1;
            self.freeze();
            self.clear_lines();
            self.update_score();
            if !self.game_over {
                self.current_piece = Piece::new(&CLASSIC_COLORS);
                if self.collide() {
                    self.game_over = true;
                    self.check_game_over();
                }
            }
        }
    }

    fn collide(&self) -> bool {
        for (y, row) in self.current_piece.matrix.iter().enumerate() {
            for (x, &is_set) in row.iter().enumerate() {
                if is_set {
                    let board_x = self.current_piece.pos.x + x as i32;
                    let board_y = self.current_piece.pos.y + y as i32;

                    if board_x < 0 || 
                       board_x >= COLS as i32 || 
                       board_y >= ROWS as i32 ||
                       (board_y >= 0 && self.board[board_y as usize][board_x as usize].is_some()) {
                        return true;
                    }
                }
            }
        }
        false
    }

    fn freeze(&mut self) {
        for (y, row) in self.current_piece.matrix.iter().enumerate() {
            for (x, &is_set) in row.iter().enumerate() {
                if is_set {
                    let board_x = (self.current_piece.pos.x + x as i32) as usize;
                    let board_y = (self.current_piece.pos.y + y as i32) as usize;
                    if board_y < ROWS && board_x < COLS {
                        self.board[board_y][board_x] = Some(self.current_piece.color.clone());
                    }
                }
            }
        }
    }

    fn clear_lines(&mut self) {
        let mut lines_cleared = 0;
        let mut y = ROWS - 1;
        
        while y > 0 {
            if self.board[y].iter().all(|cell| cell.is_some()) {
                // Удаляем заполненную линию
                self.board.remove(y);
                // Добавляем новую пустую линию сверху
                self.board.insert(0, vec![None; COLS]);
                lines_cleared += 1;
            } else {
                y -= 1;
            }
        }

        if lines_cleared > 0 {
            self.lines += lines_cleared;
            self.score += match lines_cleared {
                1 => 100,
                2 => 300,
                3 => 500,
                4 => 800,
                _ => 0,
            } * self.level;
            
            // Обновляем уровень
            self.level = (self.lines / 10 + 1).min(99);
            // Уменьшаем интервал падения
            self.drop_interval = (1000.0 * 0.8_f64.powi(self.level as i32 - 1)).max(50.0);
        }
    }

    fn rotate(&mut self) {
        let n = self.current_piece.matrix.len();
        let mut rotated = vec![vec![false; n]; n];
        
        // Поворачиваем матрицу на 90 градусов по часовой стрелке
        for y in 0..n {
            for x in 0..n {
                rotated[x][n - 1 - y] = self.current_piece.matrix[y][x];
            }
        }

        // Сохраняем старую матрицу
        let old_matrix = self.current_piece.matrix.clone();
        self.current_piece.matrix = rotated;

        // Если после поворота есть коллизия, возвращаем старую матрицу
        if self.collide() {
            self.current_piece.matrix = old_matrix;
        }
    }

    fn hard_drop(&mut self) {
        while !self.collide() {
            self.current_piece.pos.y += 1;
        }
        self.current_piece.pos.y -= 1;
        self.freeze();
        self.clear_lines();
        if !self.game_over {
            self.current_piece = Piece::new(&CLASSIC_COLORS);
            if self.collide() {
                self.game_over = true;
            }
        }
    }

    pub fn update_score(&self) {
        let document = web_sys::window().unwrap().document().unwrap();
        let score_element = document.get_element_by_id("score").unwrap();
        let lines_element = document.get_element_by_id("lines").unwrap();
        let level_element = document.get_element_by_id("level").unwrap();

        score_element.set_text_content(Some(&self.score.to_string()));
        lines_element.set_text_content(Some(&self.lines.to_string()));
        level_element.set_text_content(Some(&self.level.to_string()));
    }

    pub fn check_game_over(&mut self) {
        if self.game_over {
            let window = web_sys::window().unwrap();
            let document = window.document().unwrap();

            // Проверяем рекорд
            if self.score > self.high_score {
                self.high_score = self.score;
                
                // Сохраняем новый рекорд
                let storage = window.local_storage().unwrap().unwrap();
                storage.set_item("highScore", &self.high_score.to_string()).unwrap();
                
                // Обновляем отображение рекорда
                let highscore_element = document.get_element_by_id("highscore").unwrap();
                highscore_element.set_text_content(Some(&self.high_score.to_string()));
            }

            let game_over_element = document.get_element_by_id("game-over").unwrap();
            game_over_element.set_attribute("style", "display: block;").unwrap();
        }
    }

    pub fn set_color_scheme(&mut self, scheme: &str) -> Result<(), JsValue> {
        // Сохраняем в localStorage
        let window = web_sys::window().unwrap();
        let storage = window.local_storage().unwrap().unwrap();
        storage.set_item("colorScheme", scheme)?;

        // Существующая логика изменения цветов
        let colors = match scheme {
            "classic" => CLASSIC_COLORS,
            "pastel" => PASTEL_COLORS,
            "neon" => NEON_COLORS,
            _ => CLASSIC_COLORS,
        };
        
        // Создаем временный вектор для новых цветов
        let new_colors: Vec<String> = colors.iter().map(|&c| c.to_string()).collect();
        
        // Обновляем цвета на доске
        for row in self.board.iter_mut() {
            for cell in row.iter_mut() {
                if let Some(color) = cell {
                    if let Some(idx) = self.current_colors.iter().position(|c| c == color) {
                        *color = new_colors[idx].clone();
                    }
                }
            }
        }
        
        // Обновляем текущие цвета
        for (i, color) in new_colors.into_iter().enumerate() {
            self.current_colors[i] = color;
        }
        
        // Обновляем цвет текущей фигуры
        let shape_idx = self.current_piece.get_shape_index();
        self.current_piece.color = self.current_colors[shape_idx].clone();
        Ok(())
    }

    pub fn set_background_color(&mut self, color: &str) -> Result<(), JsValue> {
        let window = web_sys::window().unwrap();
        let storage = window.local_storage().unwrap().unwrap();
        storage.set_item("backgroundColor", color)?;

        let document = window.document().unwrap();
        let element = document.body().unwrap();
        element.set_attribute("style", &format!("background-color: {};", color))?;
        Ok(())
    }

    pub fn get_background_names(&self) -> js_sys::Array {
        let array = js_sys::Array::new();
        for (name, _) in BACKGROUNDS.iter() {
            array.push(&JsValue::from_str(name));
        }
        array
    }

    pub fn get_background_path(&self, name: &str) -> Option<String> {
        BACKGROUNDS.get(name).map(|&path| path.to_string())
    }

    pub fn set_background(&mut self, background: &str) -> Result<(), JsValue> {
        let window = web_sys::window().unwrap();
        let storage = window.local_storage().unwrap().unwrap();
        storage.set_item("backgroundImage", background)?;

        let document = window.document().unwrap();
        let element = document.body().unwrap();
        element.set_attribute("style", &format!("background-image: url('{}');", background))?;
        Ok(())
    }
}

// Реализация для Piece
impl Piece {
    fn new(colors: &[&str]) -> Self {
        let shape_idx = (Math::random() * 7.0) as usize;
        let shape = SHAPES[shape_idx];
        
        let matrix = shape.iter()
            .map(|row| row.iter().map(|&cell| cell).collect())
            .collect();

        Piece {
            matrix,
            color: colors[shape_idx].to_string(),
            pos: Position {
                x: (COLS as i32 / 2) - 1,
                y: 0,
            },
            shape_idx,
        }
    }

    fn get_shape_index(&self) -> usize {
        self.shape_idx
    }
} 