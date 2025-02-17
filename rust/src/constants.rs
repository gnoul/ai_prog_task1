use lazy_static::lazy_static;
use std::collections::HashMap;

// Константы
pub const COLS: usize = 10;
pub const ROWS: usize = 20;
pub const BLOCK_SIZE: u32 = 30;

lazy_static! {
    pub static ref BACKGROUNDS: HashMap<&'static str, &'static str> = {
        let mut map = HashMap::new();
        map.insert("Киберпанк", "pkg/backgrounds/cyberpunk.png");
        map.insert("Ретро волна", "pkg/backgrounds/retrowave.png");
        map.insert("Космический", "pkg/backgrounds/space.png");
        map.insert("Пиксельный город", "pkg/backgrounds/pixel-city.png");
        map
    };
}

// Цветовые схемы для фигур
pub const CLASSIC_COLORS: [&str; 7] = [
    "#00f0f0", // I - cyan
    "#f0f000", // O - yellow
    "#a000f0", // T - purple
    "#00f000", // S - green
    "#f00000", // Z - red
    "#0000f0", // J - blue
    "#f0a000", // L - orange
];

pub const PASTEL_COLORS: [&str; 7] = [
    "#98ddca", // I
    "#d5ecc2", // O
    "#ffd3b4", // T
    "#ffaaa7", // S
    "#ff8c94", // Z
    "#91c7b1", // J
    "#b6c9f0", // L
];

pub const NEON_COLORS: [&str; 7] = [
    "#00ffff", // I
    "#ffff00", // O
    "#ff00ff", // T
    "#00ff00", // S
    "#ff0000", // Z
    "#0000ff", // J
    "#ff8000", // L
];

pub const SHAPES: [&[&[bool]]; 7] = [
    // I
    &[&[false, false, false, false],
      &[true, true, true, true],
      &[false, false, false, false],
      &[false, false, false, false]],
    // O
    &[&[true, true],
      &[true, true]],
    // T
    &[&[false, true, false],
      &[true, true, true],
      &[false, false, false]],
    // S
    &[&[false, true, true],
      &[true, true, false],
      &[false, false, false]],
    // Z
    &[&[true, true, false],
      &[false, true, true],
      &[false, false, false]],
    // J
    &[&[true, false, false],
      &[true, true, true],
      &[false, false, false]],
    // L
    &[&[false, false, true],
      &[true, true, true],
      &[false, false, false]],
]; 