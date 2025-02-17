const COLS = 10;
const ROWS = 20;
const BLOCK_SIZE = 30;
const COLOR_SCHEMES = {
    'classic': {
        'I': '#00f0f0',
        'O': '#f0f000',
        'T': '#a000f0',
        'S': '#00f000',
        'Z': '#f00000',
        'J': '#0000f0',
        'L': '#f0a000'
    },
    'pastel': {
        'I': '#FFB5E8',
        'O': '#FFF5BA',
        'T': '#BAFFC9',
        'S': '#BAE1FF',
        'Z': '#FFB3BA',
        'J': '#B5CCFF',
        'L': '#FFDFBA'
    },
    'neon': {
        'I': '#00ffff',
        'O': '#ffff00',
        'T': '#ff00ff',
        'S': '#00ff00',
        'Z': '#ff0000',
        'J': '#0000ff',
        'L': '#ff8800'
    }
};

const SHAPES = {
    'I': [[0,0,0,0], [1,1,1,1], [0,0,0,0], [0,0,0,0]],
    'O': [[1,1], [1,1]],
    'T': [[0,1,0], [1,1,1], [0,0,0]],
    'S': [[0,1,1], [1,1,0], [0,0,0]],
    'Z': [[1,1,0], [0,1,1], [0,0,0]],
    'J': [[1,0,0], [1,1,1], [0,0,0]],
    'L': [[0,0,1], [1,1,1], [0,0,0]]
};

// Фоновые изображения
const BACKGROUNDS = [
    { name: 'Градиент', value: 'none' },
    { name: 'Пиксельный город', value: 'backgrounds/pixel-city.png' },
    { name: 'Космос', value: 'backgrounds/space.png' },
    { name: 'Киберпанк', value: 'backgrounds/cyberpunk.png' },
    { name: 'Ретро волна', value: 'backgrounds/retrowave.png' }
]; 