// Конфигурация полос для каждого ПВП
const pvpLanesConfig = {
    // Хабаровск
    '1': { e: [51, 52, 53, 54, 55], x: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] },
    '2': { e: [51, 52, 53], x: [1, 2, 3, 4, 5, 6] },
    '3': { e: [51, 52, 53, 54], x: [1, 2, 3, 4, 5, 6, 7, 8, 9] },
    '4': { e: [51, 52, 53, 54], x: [1, 2, 3, 4, 5, 6, 7, 8, 9] },
    '5': { e: [51, 52, 53, 54], x: [1, 2, 3, 4, 5, 6, 7, 8] },
    // М11
    '47': { e: [51, 52, 53, 54], x: [1, 2, 3, 4, 5, 6] },
    // Секция 1
    '58': { e: [51, 52, 53, 54], x: [1, 2, 3, 4, 5, 6, 7] },
    '67': { e: [51, 52, 53, 54, 55], x: [1, 2, 3, 4, 5, 6] },
    '89': { e: [51, 52, 53, 54], x: [1, 2, 3, 4, 5] },
    '97': { e: [51, 52], x: [1, 2] },
    // Секция 2
    '124': { e: [51, 52], x: [1, 2, 3, 4] },
    '147': { e: [51, 52, 53, 54, 55, 56, 57], x: [1, 2, 3, 4, 5, 6, 7, 8, 9] },
    // Секция 6
    '348': { e: [51, 52], x: [1, 2, 3] },
    '402': { e: [51, 52], x: [1, 2, 3] },
    '444': { e: [51, 52], x: [1, 2] },
    '524': { e: [51, 52], x: [1, 2] },
    // Отдельная секция
    '668': { e: [51, 52, 53, 54, 55], x: [1, 2, 3, 4, 5, 6, 7, 8, 9] }
};

// Секции M11
const m11Sections = ['0', '1', '2', '6', '668'];

// Подсекции M11 по километрам
const m11Subsections = {
    '1': ['58', '67', '89', '97'],
    '2': ['124', '147'],
    '6': ['348', '402', '444', '524']
};

// Функция для создания кнопок полос
function createLaneButtons(pvpNumber) {
    const config = pvpLanesConfig[pvpNumber];
    const eLanesContainer = document.querySelector('.e-lanes');
    const xLanesContainer = document.querySelector('.x-lanes');
    
    // Очищаем контейнеры
    eLanesContainer.innerHTML = '';
    xLanesContainer.innerHTML = '';
    
    // Создаем кнопки E-полос
    config.e.forEach(num => {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'lane-btn';
        button.setAttribute('data-lane', `e${num}`);
        button.textContent = `E${num}`;
        eLanesContainer.appendChild(button);
    });
    
    // Создаем кнопки X-полос
    config.x.forEach(num => {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'lane-btn';
        button.setAttribute('data-lane', `x${num.toString().padStart(2, '0')}`);
        button.textContent = `X${num.toString().padStart(2, '0')}`;
        xLanesContainer.appendChild(button);
    });
    
    // Добавляем обработчики для кнопок полос
    document.querySelectorAll('.lane-btn').forEach(button => {
        button.addEventListener('click', function() {
            // Убираем активный класс у всех кнопок полос
            document.querySelectorAll('.lane-btn').forEach(btn => 
                btn.classList.remove('active'));
            // Добавляем активный класс нажатой кнопке
            this.classList.add('active');
            // Устанавливаем значение в скрытое поле
            document.getElementById('band').value = this.getAttribute('data-lane');
            
            // Обновляем статусы устройств
            if (window.deviceStatusManager) {
                window.deviceStatusManager.updateAllStatuses();
            }
        });
    });
}

// Функция для скрытия всех подсекций
function hideAllSubsections() {
    document.querySelectorAll('.subsections').forEach(subsection => {
        subsection.style.display = 'none';
    });
}

// Обработка кнопок ПВП
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing buttons');
    
    // Создаем кнопки для выбора локации (Хабаровск/М11)
    const locationContainer = document.querySelector('.location-buttons');
    
    if (locationContainer) {
        // Создаем кнопку для Хабаровска
        const khabarovskBtn = document.createElement('button');
        khabarovskBtn.type = 'button';
        khabarovskBtn.className = 'location-btn active';
        khabarovskBtn.setAttribute('data-location', 'khabarovsk');
        khabarovskBtn.textContent = 'Хабаровск';
        
        // Создаем кнопку для М11
        const m11Btn = document.createElement('button');
        m11Btn.type = 'button';
        m11Btn.className = 'location-btn';
        m11Btn.setAttribute('data-location', 'm11');
        m11Btn.textContent = 'М11';
        
        // Добавляем кнопки в контейнер
        locationContainer.appendChild(khabarovskBtn);
        locationContainer.appendChild(m11Btn);
        
        // Добавляем обработчики для кнопок локаций
        document.querySelectorAll('.location-btn').forEach(button => {
            button.addEventListener('click', function() {
                // Убираем активный класс у всех кнопок локаций
                document.querySelectorAll('.location-btn').forEach(btn => 
                    btn.classList.remove('active'));
                // Добавляем активный класс нажатой кнопке
                this.classList.add('active');
                
                // Скрываем текущие кнопки ПВП
                document.querySelector('.pvp-buttons').style.display = 'none';
                document.querySelector('.m11-buttons').style.display = 'none';
                
                // Показываем соответствующие кнопки ПВП в зависимости от выбранной локации
                if (this.getAttribute('data-location') === 'khabarovsk') {
                    document.querySelector('.pvp-buttons').style.display = 'flex';
                    document.getElementById('location').value = 'khabarovsk';
                } else {
                    document.querySelector('.m11-buttons').style.display = 'flex';
                    document.getElementById('location').value = 'm11';
                    
                    // Скрываем все подсекции при смене локации
                    hideAllSubsections();
                }
                
                // Очищаем выбор ПВП и полосы
                document.getElementById('pvp').value = '';
                document.getElementById('band').value = '';
                document.getElementById('m11-section').value = '';
                document.getElementById('parent-section').value = '';
                document.querySelectorAll('.pvp-btn, .section-btn, .main-section-btn').forEach(btn => 
                    btn.classList.remove('active'));
                document.querySelector('.e-lanes').innerHTML = '';
                document.querySelector('.x-lanes').innerHTML = '';
            });
        });
    }
    
    // Обработчики для кнопок ПВП Хабаровска
    const pvpButtons = document.querySelectorAll('.pvp-btn');
    const pvpInput = document.getElementById('pvp');
    
    console.log('Found PVP buttons:', pvpButtons.length);
    
    pvpButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            const pvpNumber = this.getAttribute('data-pvp');
            console.log('PVP button clicked:', pvpNumber);
            
            // Убираем активный класс у всех кнопок ПВП
            pvpButtons.forEach(btn => btn.classList.remove('active'));
            
            // Добавляем активный класс текущей кнопке
            this.classList.add('active');
            
            // Устанавливаем значение в скрытое поле
            if (pvpInput) {
                pvpInput.value = pvpNumber;
                console.log('Set PVP value to:', pvpNumber);
            }
            
            // Создаем кнопки полос для выбранного ПВП
            createLaneButtons(pvpNumber);
            
            // Очищаем значение полосы
            document.getElementById('band').value = '';
            
            // Обновляем статусы устройств
            if (window.deviceStatusManager) {
                window.deviceStatusManager.updateAllStatuses();
            }
            
            e.preventDefault();
            e.stopPropagation();
        });
    });
    
    // Обработчики для основных секций М11
    const mainSectionButtons = document.querySelectorAll('.main-section-btn');
    
    mainSectionButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            const sectionNumber = this.getAttribute('data-section');
            console.log('Main section selected:', sectionNumber);
            
            // Убираем активный класс у всех кнопок основных секций
            mainSectionButtons.forEach(btn => btn.classList.remove('active'));
            
            // Добавляем активный класс текущей кнопке
            this.classList.add('active');
            
            // Скрываем все подсекции
            hideAllSubsections();
            
            // Показываем подсекции для выбранной секции
            const subsectionContainer = document.getElementById(`subsection-${sectionNumber}`);
            if (subsectionContainer) {
                subsectionContainer.style.display = 'flex';
            }
            
            // Устанавливаем значение родительской секции
            document.getElementById('parent-section').value = sectionNumber;
            
            // Очищаем значения секции и полосы
            document.getElementById('m11-section').value = '';
            document.getElementById('band').value = '';
            document.getElementById('pvp').value = '47'; // По умолчанию для М11 используем ПВП 47
            
            // Убираем активный класс у всех кнопок подсекций
            document.querySelectorAll('.section-btn').forEach(btn => 
                btn.classList.remove('active'));
            
            // Очищаем полосы
            document.querySelector('.e-lanes').innerHTML = '';
            document.querySelector('.x-lanes').innerHTML = '';
            
            e.preventDefault();
            e.stopPropagation();
        });
    });
    
    // Обработчики для кнопок подсекций M11
    const sectionButtons = document.querySelectorAll('.section-btn');
    
    sectionButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            const sectionNumber = this.getAttribute('data-section');
            const pvpNumber = this.getAttribute('data-pvp') || '47';
            const parentSection = this.getAttribute('data-parent') || '';
            console.log('M11 subsection selected:', sectionNumber);
            
            // Убираем активный класс у всех кнопок подсекций
            sectionButtons.forEach(btn => btn.classList.remove('active'));
            
            // Добавляем активный класс текущей кнопке
            this.classList.add('active');
            
            // Устанавливаем значение секции в скрытое поле
            document.getElementById('m11-section').value = sectionNumber;
            
            // Устанавливаем значение ПВП
            document.getElementById('pvp').value = pvpNumber;
            
            // Если это подсекция, также устанавливаем родительскую секцию
            if (parentSection) {
                document.getElementById('parent-section').value = parentSection;
            }
            
            // Создаем кнопки полос для выбранного ПВП (используем pvpNumber вместо sectionNumber)
            createLaneButtons(pvpNumber);
            
            // Очищаем значение полосы
            document.getElementById('band').value = '';
            
            // Обновляем статусы устройств
            if (window.deviceStatusManager) {
                window.deviceStatusManager.updateAllStatuses();
            }
            
            e.preventDefault();
            e.stopPropagation();
        });
    });
}); 