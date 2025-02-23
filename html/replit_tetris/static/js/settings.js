class GameSettings {
    constructor() {
        this.blockStyle = 'solid';
        this.bgTheme = 'cyberpunk';
        this.loadSettings();
        this.setupListeners();
    }

    loadSettings() {
        const savedSettings = localStorage.getItem('tetrisSettings');
        if (savedSettings) {
            const settings = JSON.parse(savedSettings);
            this.blockStyle = settings.blockStyle;
            this.bgTheme = settings.bgTheme;

            // Обновляем значения в модальном окне
            requestAnimationFrame(() => {
                document.getElementById('blockStyle').value = this.blockStyle;
                document.getElementById('bgTheme').value = this.bgTheme;
            });
        }
    }

    saveSettings() {
        const settings = {
            blockStyle: this.blockStyle,
            bgTheme: this.bgTheme
        };
        localStorage.setItem('tetrisSettings', JSON.stringify(settings));
    }

    setupListeners() {
        const blockStyleSelect = document.getElementById('blockStyle');
        const bgThemeSelect = document.getElementById('bgTheme');

        // Заполняем select фонами из констант
        BACKGROUNDS.forEach(bg => {
            const option = document.createElement('option');
            option.value = bg.id;
            option.textContent = bg.name;
            bgThemeSelect.appendChild(option);
        });

        // Используем debounce для предотвращения частых сохранений
        const debounceSave = this.debounce(() => this.saveSettings(), 300);

        blockStyleSelect.addEventListener('change', (e) => {
            this.blockStyle = e.target.value;
            debounceSave();
        });

        bgThemeSelect.addEventListener('change', (e) => {
            this.bgTheme = e.target.value;
            debounceSave();
        });
    }

    // Утилита для debounce
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
}