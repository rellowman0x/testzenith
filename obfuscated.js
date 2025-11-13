        const supabaseUrl = 'https://didzuiwhxfogxakqhjpr.supabase.co';
        const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRpZHp1aXdoeGZvZ3hha3FoanByIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkzMjkwNTMsImV4cCI6MjA2NDkwNTA1M30.5EmBfVBPPL5MlDhAuqShKRGtcBzGgM-j_QOrk87YmX4';
        const tg = window.Telegram.WebApp;
        tg.expand();
        let supabase;
        let currentTab = 'home';
        let currentUserId = null;
        let userStatus = 'user';
        let isAdmin = false;
        let currentAddAdminTab = 'manual';
        let selectedUserId = null;
        let editingUserId = null;
        let adminPinVerified = false;
        let activationCode = null;
        let katexInitialized = false;
        function initKatex() {
            if (katexInitialized) return;
            
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = 'https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css';
            document.head.appendChild(link);

            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.js';
            script.onload = () => {
                katexInitialized = true;
                renderAllKatex();
            };
            document.head.appendChild(script);
        }
        function renderAllKatex() {
            if (typeof katex === 'undefined') return;
            
            const elements = document.querySelectorAll('.katex-formula');
            elements.forEach(element => {
                try {
                    katex.render(element.textContent, element, {
                        throwOnError: false
                    });
                } catch (error) {
                    console.error('KaTeX error:', error);
                }
            });
        }
        let userFilters = {
            role: '',
            id: '',
            name: '',
            username: '',
            lastSeen: ''
        };
        let logsFilters = {
            action: '',
            user: '',
            dateFrom: '',
            dateTo: ''
        };

        function showLogsFiltersModal() {
            document.getElementById('logs-filter-action').value = logsFilters.action;
            document.getElementById('logs-filter-user').value = logsFilters.user;
            document.getElementById('logs-filter-date-from').value = logsFilters.dateFrom;
            document.getElementById('logs-filter-date-to').value = logsFilters.dateTo;
            
            document.getElementById('logs-filters-modal').classList.remove('hidden');
        }

        function closeLogsFiltersModal() {
            document.getElementById('logs-filters-modal').classList.add('hidden');
        }

        function resetLogsFilters() {
            logsFilters = {
                action: '',
                user: '',
                dateFrom: '',
                dateTo: ''
            };
            document.getElementById('logs-filter-action').value = '';
            document.getElementById('logs-filter-user').value = '';
            document.getElementById('logs-filter-date-from').value = '';
            document.getElementById('logs-filter-date-to').value = '';
            loadLogs();
        }

        async function applyLogsFilters() {
            logsFilters = {
                action: document.getElementById('logs-filter-action').value.trim(),
                user: document.getElementById('logs-filter-user').value.trim(),
                dateFrom: document.getElementById('logs-filter-date-from').value,
                dateTo: document.getElementById('logs-filter-date-to').value
            };
            
            closeLogsFiltersModal();
            loadLogs();
        }

        async function toggleLogging() {
            if (userStatus !== 'developer') {
                document.getElementById('logging-toggle').checked = true;
                showCustomAlert('Данная функция недоступна', 'error');
                shakePage();
                return;
            }
            
            const isChecked = document.getElementById('logging-toggle').checked;
            
            if (currentUserId && supabase) {
                try {
                    await supabase
                        .from('users')
                        .update({
                            logging_enabled: isChecked,
                            updated_at: new Date().toISOString()
                        })
                        .eq('id', currentUserId);
                    await logAction('settings_change', {
                        setting: 'logging',
                        value: isChecked,
                        section: 'system'
                    });
                    showCustomAlert('Настройка логирования сохранена', 'success');
                } catch (error) {
                    console.error('Ошибка сохранения настроек логирования:', error);
                    showCustomAlert('Ошибка сохранения настроек', 'error');
                }
            }
        }
        function showFiltersModal() {
            document.getElementById('filter-role').value = userFilters.role;
            document.getElementById('filter-id').value = userFilters.id;
            document.getElementById('filter-name').value = userFilters.name;
            document.getElementById('filter-username').value = userFilters.username;
            document.getElementById('filter-last-seen').value = userFilters.lastSeen;
            
            document.getElementById('filters-modal').classList.remove('hidden');
        }

        function closeFiltersModal() {
            document.getElementById('filters-modal').classList.add('hidden');
        }

        function applyFilters() {
            userFilters = {
                role: document.getElementById('filter-role').value,
                id: document.getElementById('filter-id').value.trim(),
                name: document.getElementById('filter-name').value.trim(),
                username: document.getElementById('filter-username').value.trim(),
                lastSeen: document.getElementById('filter-last-seen').value
            };
            
            closeFiltersModal();
            loadUsersList();
        }
        function openEditUserModal(userId, event) {
            if (event) event.stopPropagation();
            editingUserId = userId;
            const modal = document.createElement('div');
            modal.className = 'modal';
            modal.innerHTML = `
                <div class="modal-content">
                    <h3>Редактирование пользователя</h3>
                    <div id="edit-user-content" style="margin-bottom: 20px;">
                        <div class="form-group">
                            <label>Статус:</label>
                            <select id="user-status-select" class="form-control">
                                <option value="user">Пользователь</option>
                                <option value="admin">Администратор</option>
                                <option value="developer">Разработчик</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label>Тема:</label>
                            <select id="user-theme-select" class="form-control">
                                <option value="light">Светлая</option>
                                <option value="dark">Тёмная</option>
                                <option value="light-purple">Фиолетовая светлая</option>
                                <option value="dark-purple">Фиолетовая тёмная</option>
                                <option value="light-green">Зеленая светлая</option>
                                <option value="dark-green">Зеленая тёмная</option>
                                <option value="light-red">Красная светлая</option>
                                <option value="dark-red">Красная тёмная</option>
                                <option value="light-blue">Синяя светлая</option>
                                <option value="dark-blue">Синяя тёмная</option>
                                <option value="light-pink">Розовая светлая</option>
                                <option value="dark-pink">Розовая тёмная</option>
                                <option value="light-orange">Оранжевая светлая</option>
                                <option value="dark-orange">Оранжевая тёмная</option>
                            </select>
                        </div>
                        <div class="switch-container">
                            <span>Анимация обводки</span>
                            <label class="switch">
                                <input type="checkbox" id="user-animation-toggle">
                                <span class="slider"></span>
                            </label>
                        </div>
                        <div class="switch-container">
                            <span>Анимация тегов</span>
                            <label class="switch">
                                <input type="checkbox" id="user-gradient-toggle">
                                <span class="slider"></span>
                            </label>
                        </div>
                        <div class="switch-container">
                            <span>Отображение тегов</span>
                            <label class="switch">
                                <input type="checkbox" id="user-tags-toggle">
                                <span class="slider"></span>
                            </label>
                        </div>
                        <div class="switch-container">
                            <span>Логирование</span>
                            <label class="switch">
                                <input type="checkbox" id="user-logging-toggle">
                                <span class="slider"></span>
                            </label>
                        </div>
                        <div class="switch-container">
                            <span>Иконки</span>
                            <label class="switch">
                                <input type="checkbox" id="user-icons-toggle">
                                <span class="slider"></span>
                            </label>
                        </div>
                    </div>
                    <div class="modal-actions" style="background: var(--background-color) !important;">
                        <button onclick="this.closest('.modal').remove()">Отмена</button>
                        <button onclick="saveUserChanges()" class="primary">Сохранить</button>
                    </div>
                </div>
            `;
            document.body.appendChild(modal);
            loadCurrentUserSettings(userId);
        }
        async function loadCurrentUserSettings(userId) {
            try {
                const { data: user, error } = await supabase
                    .from('users')
                    .select('*')
                    .eq('id', userId)
                    .single();
                if (error) throw error;
                document.getElementById('user-status-select').value = user.status;
                document.getElementById('user-theme-select').value = user.theme || 'light';
                document.getElementById('user-animation-toggle').checked = user.animation_enabled === true;
                document.getElementById('user-gradient-toggle').checked = user.gradient_enabled === true;
                document.getElementById('user-tags-toggle').checked = user.tags_enabled !== false;
                document.getElementById('user-logging-toggle').checked = user.logging_enabled !== false;
                document.getElementById('user-icons-toggle').checked = user.icons_enabled !== false;
            } catch (error) {
                console.error('Ошибка загрузки настроек пользователя:', error);
                showCustomAlert('Ошибка загрузки данных пользователя', 'error');
            }
        }
        async function toggleIcons() {
            const isChecked = document.getElementById('icons-toggle').checked;
            
            if (isChecked) {
                document.body.classList.add('show-icons');
                loadIcons();
            } else {
                document.body.classList.remove('show-icons');
                removeIcons();
            }
            
            if (currentUserId && supabase) {
                try {
                    await supabase.from('users').update({
                        icons_enabled: isChecked,
                        updated_at: new Date().toISOString()
                    }).eq('id', currentUserId);
                    await logAction('settings_change', {
                        setting: 'show_icons',
                        value: isChecked,
                        section: 'appearance'
                    });
                } catch (error) {
                    console.error('Ошибка сохранения настроек иконок:', error);
                }
            }
        }
        function loadIcons() {
            const tabs = document.querySelectorAll('.tab');
            tabs.forEach(tab => {
                const onclick = tab.getAttribute('onclick');
                if (onclick.includes('home')) {
                    tab.setAttribute('data-icon', 'f015');
                } else if (onclick.includes('education')) {
                    tab.setAttribute('data-icon', 'f19d');
                } else if (onclick.includes('settings')) {
                    tab.setAttribute('data-icon', 'f013');
                } else if (onclick.includes('admin')) {
                    tab.setAttribute('data-icon', 'f18e');
                }
            });
        }
        function removeIcons() {
            const tabs = document.querySelectorAll('.tab');
            tabs.forEach(tab => {
                tab.removeAttribute('data-icon');
            });
        }
        function updateIcons() {
            const iconsEnabled = document.getElementById('icons-toggle').checked;
            if (iconsEnabled) {
                loadIcons();
                document.body.classList.add('show-icons');
            } else {
                removeIcons();
                document.body.classList.remove('show-icons');
            }
        }
        async function loadCurrentUserStatus(userId) {
            try {
                const { data: user, error } = await supabase
                    .from('users')
                    .select('status')
                    .eq('id', userId)
                    .single();
                    
                if (error) throw error;
                
                const select = document.getElementById('user-status-select');
                select.value = user.status;
            } catch (error) {
                console.error('Ошибка загрузки статуса:', error);
                showCustomAlert('Ошибка загрузки данных пользователя', 'error');
            }
        }

        async function saveUserChanges() {
            const newStatus = document.getElementById('user-status-select').value;
            const newTheme = document.getElementById('user-theme-select').value;
            const newAnimation = document.getElementById('user-animation-toggle').checked;
            const newGradient = document.getElementById('user-gradient-toggle').checked;
            const newTags = document.getElementById('user-tags-toggle').checked;
            const newLogging = document.getElementById('user-logging-toggle').checked;
            const newIcons = document.getElementById('user-icons-toggle').checked;

            try {
                const { error } = await supabase
                    .from('users')
                    .update({ 
                        status: newStatus,
                        theme: newTheme,
                        animation_enabled: newAnimation,
                        gradient_enabled: newGradient,
                        tags_enabled: newTags,
                        logging_enabled: newLogging,
                        icons_enabled: newIcons,
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', editingUserId);
                if (error) throw error;
                await logAction('admin_user_edit', {
                    target_user_id: editingUserId,
                    changes: {
                        status: newStatus,
                        theme: newTheme,
                        animation: newAnimation,
                        gradient: newGradient,
                        tags: newTags,
                        logging: newLogging,
                        icons: newIcons
                    }
                });
                showCustomAlert('Изменения сохранены', 'success');
                document.querySelector('.modal').remove();
                loadUsersList();
            } catch (error) {
                console.error('Ошибка сохранения:', error);
                showCustomAlert('Ошибка сохранения изменений', 'error');
            }
        }
        async function initSupabase() {
            try {
                const { createClient } = await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm');
                return createClient(supabaseUrl, supabaseKey);
            } catch (error) {
                console.error('Ошибка инициализации Supabase:', error);
                throw error;
            }
        }
        
        async function switchAdminTab(tabId) {
            const currentTab = document.querySelector('.admin-tab.active');
            const currentContent = document.querySelector('.admin-content.active');
            const newTab = document.querySelector(`.admin-tab[onclick="switchAdminTab('${tabId}')"]`);
            const newContent = document.getElementById(`${tabId}-content`);
            currentContent.style.opacity = '0';
            currentContent.style.transform = 'translateY(10px)';
            
            setTimeout(() => {
                currentTab.classList.remove('active');
                currentContent.classList.remove('active');
                
                newTab.classList.add('active');
                newContent.classList.add('active');
                setTimeout(() => {
                    newContent.style.opacity = '1';
                    newContent.style.transform = 'translateY(0)';
                }, 10);
                
                if (tabId === 'users') {
                    loadUsersList();
                }
                if (tabId === 'logs') {
                    loadLogs();
                }
                if (tabId === 'mode') {
                    loadMaintenanceMode();
                }
            }, 300);
        }
        const originalConsoleLog = console.log;
        const originalConsoleError = console.error;
        const originalConsoleWarn = console.warn;

        const consoleMessages = [];

        console.log = function(...args) {
            if (args.length > 0 && typeof args[0] === 'string' && args[0].includes('[Telegram.WebView]')) {
                return;
            }
            consoleMessages.push({ type: 'log', args });
            originalConsoleLog.apply(console, args);
            updateConsoleOutput();
        };

        console.error = function(...args) {
            consoleMessages.push({ type: 'error', args });
            originalConsoleError.apply(console, args);
            updateConsoleOutput();
            showErrorButton();
        };

        console.warn = function(...args) {
            consoleMessages.push({ type: 'warn', args });
            originalConsoleWarn.apply(console, args);
            updateConsoleOutput();
            showErrorButton();
        };

        async function loadUsersList() {
            const usersList = document.getElementById('users-list');
            usersList.innerHTML = `
                <div class="admin-loading">
                    <div class="admin-loading-spinner"></div>
                    <div class="admin-loading-text">Загрузка списка пользователей</div>
                </div>
            `;
            try {
                let query = supabase.from('users').select('*');
                
                if (userFilters.role) {
                    query = query.eq('status', userFilters.role);
                }
                
                if (userFilters.id) {
                    query = query.ilike('id', `%${userFilters.id}%`);
                }
                
                if (userFilters.name) {
                    query = query.or(`first_name.ilike.%${userFilters.name}%,last_name.ilike.%${userFilters.name}%`);
                }
                
                if (userFilters.username) {
                    query = query.ilike('username', `%${userFilters.username}%`);
                }
                
                if (userFilters.lastSeen) {
                    const now = new Date();
                    let dateFilter;
                    
                    switch (userFilters.lastSeen) {
                        case 'today':
                            dateFilter = new Date(now.setHours(0, 0, 0, 0)).toISOString();
                            break;
                        case 'week':
                            dateFilter = new Date(now.setDate(now.getDate() - 7)).toISOString();
                            break;
                        case 'month':
                            dateFilter = new Date(now.setMonth(now.getMonth() - 1)).toISOString();
                            break;
                        case 'older':
                            dateFilter = new Date(now.setMonth(now.getMonth() - 6)).toISOString();
                            break;
                    }
                    
                    if (dateFilter) {
                        query = query.gte('last_seen', dateFilter);
                    }
                }
                
                const { data: users, error } = await query;
                
                if (error) throw error;
                document.getElementById('users-count').textContent = users.length;
                if (users.length === 0) {
                    usersList.innerHTML = '<div class="no-users">Ничего не найдено</div>';
                    return;
                }

                const tagsEnabled = document.getElementById('tags-toggle').checked;
                const gradientEnabled = document.getElementById('gradient-toggle').checked;
                let html = '';
                for (const user of users) {
                    let statusHtml = '';
                    if (tagsEnabled) {
                        const gradientClass = gradientEnabled ? ' gradient' : '';
                        const statusClass = user.status === 'developer' ? 'developer' : 
                                            user.status === 'admin' ? 'admin' : 'user';
                        const statusText = user.status === 'developer' ? 'Разработчик' : 
                                            user.status === 'admin' ? 'Администратор' : 'Пользователь';
                        statusHtml = `<span class="user-status status-${statusClass}${gradientClass}">${statusText}</span>`;
                    } else {
                        statusHtml = user.status === 'developer' ? 'Разработчик' : 
                                    user.status === 'admin' ? 'Администратор' : 'Пользователь';
                    }
                    const editButton = userStatus === 'developer' ? 
                        `<button class="action-btn" onclick="openEditUserModal('${user.id}', event)" title="Редактировать">
                            <i class="fas fa-pencil-alt"></i>
                        </button>` : '';

                    const deleteButton = userStatus === 'developer' ? 
                        `<button class="action-btn delete-btn" onclick="deleteUser('${user.id}', event)" title="Удалить пользователя">
                            <i class="fas fa-trash-alt"></i>
                        </button>` : '';

                    html += `
                        <div class="admin-item">
                            <div style="display: flex; flex-direction: column;">
                                <strong>${user.first_name || 'Неизвестно'}</strong>
                                <small>ID: ${user.id}</small>
                                ${statusHtml}
                            </div>
                            <div style="display: flex; gap: 8px; align-items: center;">
                                ${editButton}
                                <button class="action-btn" onclick="showUserInfo('${user.id}', event)" title="Информация">
                                    <i class="fas fa-info-circle"></i>
                                </button>
                                ${deleteButton}
                            </div>
                        </div>
                    `;
                }
                usersList.innerHTML = html;
            } catch (error) {
                console.error('Ошибка загрузки списка пользователей:', error);
                usersList.innerHTML = '<div class="error-message">Ошибка загрузки данных</div>';
            }
        }

        function showCustomAlert(message, type = 'info') {
            const alert = document.createElement('div');
            alert.className = 'custom-alert';
            let icon = '';
            switch(type) {
                case 'success': icon = '<i class="fas fa-check-circle"></i>'; break;
                case 'error': icon = '<i class="fas fa-exclamation-circle"></i>'; break;
                default: icon = '<i class="fas fa-info-circle"></i>';
            }
            alert.innerHTML = `${icon} ${message}`;
            document.body.appendChild(alert);
            setTimeout(() => alert.classList.add('show'), 10);
            alert.addEventListener('click', () => {
                alert.classList.remove('show');
                setTimeout(() => alert.remove(), 300);
            });
            setTimeout(() => {
                alert.classList.remove('show');
                setTimeout(() => alert.remove(), 300);
            }, 3000);
        }

        function updateConsoleOutput() {
            const output = document.getElementById('console-output');
            if (output) {
                output.textContent = consoleMessages.map(msg => {
                    const type = msg.type.toUpperCase();
                    const text = msg.args.map(arg => 
                        typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
                    ).join(' ');
                    return `[${type}] ${text}`;
                }).join('\n');
                output.scrollTop = output.scrollHeight;
            }
        }

        async function toggleGradient() {
            const isChecked = document.getElementById('gradient-toggle').checked;
            const tagsEnabled = document.getElementById('tags-toggle').checked;
            
            if (isChecked && !tagsEnabled) {
                showCustomAlert('Включите отображение тегов для активации переливания', 'error');
                document.getElementById('gradient-toggle').checked = false;
                shakePage();
                return;
            }
            
            updateTagsAppearance();
            
            if (currentUserId && supabase) {
                try {
                    await supabase
                        .from('users')
                        .update({
                            gradient_enabled: isChecked,
                            updated_at: new Date().toISOString()
                        })
                        .eq('id', currentUserId);
                    await logAction('settings_change', {
                        setting: 'gradient_effects',
                        value: isChecked,
                        section: 'appearance'
                    });
                } catch (error) {
                    console.error('Ошибка сохранения настроек градиента:', error);
                }
            }
        }

        async function toggleTags() {
            const isChecked = document.getElementById('tags-toggle').checked;
            const gradientEnabled = document.getElementById('gradient-toggle').checked;
            if (!isChecked && gradientEnabled) {
                document.getElementById('gradient-toggle').checked = false;
                toggleGradient();
            }
            if (isChecked) {
                document.body.classList.remove('hide-tags');
            } else {
                document.body.classList.add('hide-tags');
            }
            updateTagsAppearance();
            if (currentUserId && supabase) {
                try {
                    await supabase
                        .from('users')
                        .update({
                            tags_enabled: isChecked,
                            updated_at: new Date().toISOString()
                        })
                        .eq('id', currentUserId);
                    await logAction('settings_change', {
                        setting: 'show_tags',
                        value: isChecked,
                        section: 'appearance'
                    });
                } catch (error) {
                    console.error('Ошибка сохранения настроек тегов:', error);
                }
            }
        }

        function updateTagsAppearance() {
            const tagsEnabled = document.getElementById('tags-toggle').checked;
            const gradientEnabled = document.getElementById('gradient-toggle').checked;
            
            document.querySelectorAll('.beta-badge, .user-status, .swiftx-tag, .status-user, .status-admin, .status-developer, .dev-badge').forEach(tag => {
                if (tagsEnabled) {
                    tag.style.display = 'inline-block';
                    if (gradientEnabled) {
                        tag.classList.add('gradient');
                        tag.style.animation = 'none';
                    } else {
                        tag.classList.remove('gradient');
                        tag.style.animation = 'none';
                    }
                } else {
                    tag.style.display = 'none';
                    tag.classList.remove('gradient');
                    tag.style.animation = 'none';
                }
            });
        }

        function showErrorButton() {
            const errorBtn = document.getElementById('error-btn');
            if (errorBtn) {
                errorBtn.classList.remove('hidden');
            }
        }

        function clearConsole() {
            consoleMessages.length = 0;
            updateConsoleOutput();
            showCustomAlert('Консоль очищена', 'success');
        }

        function toggleCollapsible(id) {
            const content = document.getElementById(id);
            const icon = content.previousElementSibling.querySelector('i');
            content.classList.toggle('active');
            
            if (icon) {
                icon.classList.toggle('collapsible-icon-rotate');
            }
        }

        function copyConsole() {
            const output = document.getElementById('console-output');
            if (output) {
                navigator.clipboard.writeText(output.textContent)
                    .then(() => showCustomAlert('Консоль скопирована', 'success'))
                    .catch(err => console.error('Ошибка копирования:', err));
            }
        }

        function closeConsole() {
            document.getElementById('console-modal').classList.add('hidden');
        }
        document.addEventListener('DOMContentLoaded', () => {
            const errorBtn = document.getElementById('error-btn');
            if (errorBtn) {
                errorBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    document.getElementById('console-modal').classList.toggle('hidden');
                });
                setTimeout(() => {
                    if (consoleMessages.some(msg => msg.type === 'error' || msg.type === 'warn')) {
                        errorBtn.classList.remove('hidden');
                    }
                }, 1000);
            }
        });

        async function showUserInfo(userId, event) {
            if (event && typeof event.stopPropagation === 'function') {
                event.stopPropagation();
            }
            let modal = document.getElementById('user-info-modal');
            const userInfoContent = document.getElementById('user-info-content');
            if (!modal) {
                modal = document.createElement('div');
                modal.id = 'user-info-modal';
                modal.className = 'modal hidden';
                modal.innerHTML = `
                    <div class="modal-content">
                        <div class="modal-header">
                            <h3 class="modal-title">👤 Информация о пользователе</h3>
                        </div>
                    </div>
                `;
                document.body.appendChild(modal);
            }
            modal.classList.remove('hidden');
            userInfoContent.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Загрузка...';
            try {
                const { data: user, error } = await supabase
                    .from('users')
                    .select('*')
                    .eq('id', userId)
                    .single();

                if (error || !user) {
                    throw new Error('Пользователь не найден');
                }
                const lastSeen = new Date(user.last_seen).toLocaleString();
                const statusClass = user.status === 'developer' ? 'status-developer' : 
                                    user.status === 'admin' ? 'status-admin' : 'status-user';
                const statusText = user.status === 'developer' ? 'Разработчик' : 
                                    user.status === 'admin' ? 'Администратор' : 'Пользователь';

                userInfoContent.innerHTML = `
                    <div class="modal-header">
                        <h3 class="modal-title">👤 ${user.first_name || 'Неизвестно'}</h3>
                    </div>
                    <div class="modal-body">
                        <div class="info-section">
                            <div class="info-label"><i class="fas fa-id-card"></i> ID пользователя</div>
                            <div class="info-value">${user.id}</div>
                        </div>
                        <div class="info-section">
                            <div class="info-label"><i class="fas fa-user-tag"></i> Имя</div>
                            <div class="info-value">${user.first_name || 'Не указано'} ${user.last_name || ''}</div>
                        </div>
                        <div class="info-section">
                            <div class="info-label"><i class="fas fa-at"></i> Username</div>
                            <div class="info-value">${user.username ? '@' + user.username : 'Не указан'}</div>
                        </div>
                        <div class="info-section">
                            <div class="info-label"><i class="fas fa-crown"></i> Статус</div>
                            <div class="info-value ${statusClass}">${statusText}</div>
                        </div>
                        <div class="info-section">
                            <div class="info-label"><i class="far fa-clock"></i> Последний вход</div>
                            <div class="info-value">${lastSeen}</div>
                        </div>
                        <div class="info-section">
                            <div class="info-label"><i class="fas fa-palette"></i> Тема</div>
                            <div class="info-value">${user.theme || 'Не установлена'}</div>
                        </div>
                        <div class="info-section">
                            <div class="info-label"><i class="fas fa-history"></i> Создан</div>
                            <div class="info-value">${new Date(user.created_at).toLocaleString()}</div>
                        </div>
                    </div>
                `;
            } catch (error) {
                userInfoContent.innerHTML = `
                    <div class="modal-header">
                        <h3 class="modal-title">❌ Ошибка</h3>
                    </div>
                    <div class="modal-body" style="text-align: center; padding: 40px;">
                        <i class="fas fa-exclamation-triangle" style="font-size: 48px; color: #dc3545; margin-bottom: 20px;"></i>
                        <p style="font-size: 20px; font-weight: 600; color: var(--text-color);">Не удалось загрузить данные</p>
                        <p style="font-size: 14px; color: var(--text-color); opacity: 0.8; margin-top: 10px;">${error.message}</p>
                    </div>
                `;
            }
        }
        async function loadLogs() {
            const logsList = document.getElementById('logs-list');
            logsList.innerHTML = `
                <div class="admin-loading">
                    <div class="admin-loading-spinner"></div>
                    <div class="admin-loading-text">Загрузка логов</div>
                </div>
            `;

            try {
                let query = supabase
                    .from('user_logs')
                    .select(`
                        *,
                        users (id, first_name, username, status)
                    `, { count: 'exact' })
                    .order('created_at', { ascending: false });

                if (logsFilters.action) {
                    query = query.ilike('action', `%${logsFilters.action}%`);
                }

                if (logsFilters.user) {
                    query = query.or(`users.first_name.ilike.%${logsFilters.user}%,users.last_name.ilike.%${logsFilters.user}%,users.username.ilike.%${logsFilters.user}%,users.id.ilike.%${logsFilters.user}%`);
                }

                if (logsFilters.dateFrom) {
                    const dateFrom = new Date(logsFilters.dateFrom);
                    dateFrom.setHours(0, 0, 0, 0);
                    query = query.gte('created_at', dateFrom.toISOString());
                }

                if (logsFilters.dateTo) {
                    const dateTo = new Date(logsFilters.dateTo);
                    dateTo.setHours(23, 59, 59, 999);
                    query = query.lte('created_at', dateTo.toISOString());
                }

                const { data: logs, error, count } = await query;

                if (error) throw error;

                document.getElementById('logs-count').textContent = count || 0;

                let html = '';
                for (const log of logs) {
                    const user = log.users;
                    const logType = getLogType(log.action);
                    
                    html += `
                        <div class="admin-item log-item log-item-${logType}">
                            <div style="display: flex; flex-direction: column;">
                                <strong>${user.first_name || 'Неизвестно'} (ID: ${user.id})</strong>
                                <small>Действие: ${log.action}</small>
                                <small>Время: ${new Date(log.created_at).toLocaleString()}</small>
                            </div>
                            <div style="display: flex; gap: 8px; align-items: center;">
                                <button class="action-btn" onclick="showLogInfo(${log.id})" title="Информация">
                                    <i class="fas fa-info-circle"></i>
                                </button>
                                <button class="action-btn delete-btn" onclick="deleteLog(${log.id})" title="Удалить лог">
                                    <i class="fas fa-trash-alt"></i>
                                </button>
                            </div>
                        </div>
                    `;
                }
                logsList.innerHTML = html;
            } catch (error) {
                console.error('Ошибка загрузки логов:', error);
                logsList.innerHTML = '<div class="error-message">Ошибка загрузки логов</div>';
            }
        }

        function getLogType(action) {
            if (action.includes('error') || action.includes('fail')) return 'error';
            if (action.includes('success') || action.includes('complete')) return 'success';
            if (action.includes('warning') || action.includes('alert')) return 'warning';
            return 'info';
        }   
        async function deleteUser(userId, event) {
            if (event) event.stopPropagation();
            const modal = document.getElementById('confirm-delete-modal');
            const message = document.getElementById('confirm-delete-message');
            const confirmBtn = document.getElementById('confirm-delete-confirm');
            const cancelBtn = document.getElementById('confirm-delete-cancel');

            message.textContent = `Вы точно хотите удалить этого пользователя и ВСЕ его данные? Это действие необратимо!`;
            modal.classList.remove('hidden');
            const handleConfirm = async () => {
                try {
                    const { error: logsError } = await supabase
                        .from('user_logs')
                        .delete()
                        .eq('user_id', userId);
                    if (logsError) throw logsError;
                    const { error: userError } = await supabase
                        .from('users')
                        .delete()
                        .eq('id', userId);
                    if (userError) throw userError;

                    showCustomAlert('Пользователь и его данные успешно удалены', 'success');
                    await logAction('admin_user_delete', {
                        target_user_id: userId,
                        deleted_by: currentUserId
                    });
                    loadUsersList();
                } catch (error) {
                    console.error('Ошибка удаления пользователя:', error);
                    showCustomAlert('Ошибка удаления пользователя', 'error');
                } finally {
                    modal.classList.add('hidden');
                    confirmBtn.removeEventListener('click', handleConfirm);
                    cancelBtn.removeEventListener('click', handleCancel);
                }
            };
            const handleCancel = () => {
                modal.classList.add('hidden');
                confirmBtn.removeEventListener('click', handleConfirm);
                cancelBtn.removeEventListener('click', handleCancel);
            };
            confirmBtn.addEventListener('click', handleConfirm, { once: true });
            cancelBtn.addEventListener('click', handleCancel, { once: true });
        }
        async function showLogInfo(logId) {
            try {
                const { data: log, error } = await supabase
                    .from('user_logs')
                    .select(`
                        *,
                        users (id, first_name, username, status)
                    `)
                    .eq('id', logId)
                    .single();

                if (error) throw error;

                const user = log.users;
                const modal = document.createElement('div');
                modal.className = 'modal';
                
                modal.innerHTML = `
                    <div class="modal-content">
                        <div class="modal-header">
                            <h3 class="modal-title">📋 Информация о логе</h3>
                        </div>
                        <div class="modal-body">
                            <div class="info-section">
                                <div class="info-label"><i class="fas fa-hashtag"></i> ID лога</div>
                                <div class="info-value">${log.id}</div>
                            </div>
                            <div class="info-section">
                                <div class="info-label"><i class="fas fa-user"></i> Пользователь</div>
                                <div class="info-value">${user.first_name || 'Неизвестно'} (ID: ${user.id})</div>
                            </div>
                            <div class="info-section">
                                <div class="info-label"><i class="fas fa-at"></i> Username</div>
                                <div class="info-value">${user.username ? '@' + user.username : 'Не указан'}</div>
                            </div>
                            <div class="info-section">
                                <div class="info-label"><i class="fas fa-bolt"></i> Действие</div>
                                <div class="info-value">${log.action}</div>
                            </div>
                            <div class="info-section">
                                <div class="info-label"><i class="far fa-clock"></i> Время</div>
                                <div class="info-value">${new Date(log.created_at).toLocaleString()}</div>
                            </div>
                            <div class="info-section">
                                <div class="info-label"><i class="fas fa-info-circle"></i> Детали</div>
                                <pre class="info-json">${JSON.stringify(log.details, null, 2)}</pre>
                            </div>
                            <div class="info-section">
                                <div class="info-label"><i class="fas fa-laptop-code"></i> User Agent</div>
                                <div class="info-value" style="font-size: 13px; font-family: 'Courier New', monospace; word-break: break-all;">${log.user_agent}</div>
                            </div>
                        </div>
                        <div class="modal-actions" style="background: var(--background-color) !important;">
                            <button onclick="this.closest('.modal').remove()" style="flex: 1;">
                                <i class="fas fa-check"></i> Понятно
                            </button>
                        </div>
                    </div>
                `;

                document.body.appendChild(modal);
                setTimeout(() => {
                    modal.style.opacity = '1';
                }, 10);
                modal.addEventListener('click', (e) => {
                    if (e.target === modal) {
                        modal.style.opacity = '0';
                        setTimeout(() => {
                            modal.remove();
                        }, 300);
                    }
                });

            } catch (error) {
                console.error('Ошибка загрузки информации о логе:', error);
                showCustomAlert('Ошибка загрузки информации о логе', 'error');
            }
        }
        async function deleteLog(logId) {
            const modal = document.getElementById('confirm-delete-modal');
            const message = document.getElementById('confirm-delete-message');
            const confirmBtn = document.getElementById('confirm-delete-confirm');
            const cancelBtn = document.getElementById('confirm-delete-cancel');

            message.textContent = `Вы точно хотите удалить этот лог? Это действие необратимо!`;
            modal.classList.remove('hidden');
            const handleConfirm = async () => {
                try {
                    const { error } = await supabase
                        .from('user_logs')
                        .delete()
                        .eq('id', logId);
                    if (error) throw error;

                    showCustomAlert('Лог успешно удален', 'success');
                    loadLogs();
                } catch (error) {
                    console.error('Ошибка удаления лога:', error);
                    showCustomAlert('Ошибка удаления лога', 'error');
                } finally {
                    modal.classList.add('hidden');
                    confirmBtn.removeEventListener('click', handleConfirm);
                    cancelBtn.removeEventListener('click', handleCancel);
                }
            };
            const handleCancel = () => {
                modal.classList.add('hidden');
                confirmBtn.removeEventListener('click', handleConfirm);
                cancelBtn.removeEventListener('click', handleCancel);
            };

            confirmBtn.addEventListener('click', handleConfirm, { once: true });
            cancelBtn.addEventListener('click', handleCancel, { once: true });
        }

        function getStatusDisplay(status) {
            switch(status) {
                case 'developer': return '<i class="fas fa-code"></i> Разработчик';
                case 'admin': return '<i class="fas fa-crown"></i> Администратор';
                default: return '<i class="fas fa-user"></i> Пользователь';
            }
        }

        function copyToClipboard(text) {
            navigator.clipboard.writeText(text)
                .then(() => showCustomAlert('ID скопирован в буфер обмена'))
                .catch(err => console.error('Ошибка копирования:', err));
        }

        function closeUserInfo() {
            document.getElementById('user-info-modal').classList.add('hidden');
        }

        function initEventHandlers() {
            document.querySelectorAll('.tab').forEach(tab => {
                tab.addEventListener('click', function() {
                    const tabId = this.getAttribute('onclick').match(/switchTab\('([^']+)'/)[1];
                    switchTab(tabId);
                });
            });
            document.querySelectorAll('.theme-option').forEach(option => {
                option.addEventListener('click', function() {
                    const theme = this.getAttribute('onclick').match(/applyTheme\('([^']+)'/)[1];
                    applyTheme(theme);
                });
            });
            document.getElementById('border-animation-toggle').addEventListener('change', toggleBorderAnimation);
        }

        async function loadUsersForSelection() {
            const list = document.getElementById('users-select-list');
            list.innerHTML = '<div class="loading-spinner"><i class="fas fa-spinner fa-spin"></i> Загрузка...</div>';
            
            try {
                const { data: users, error } = await supabase
                    .from('users')
                    .select('*');
                    
                if (error) throw error;
                
                let html = '';
                users.forEach(user => {
                    html += `
                        <div class="user-select-item" onclick="selectUserForAdmin('${user.id}', this)" 
                            style="padding: 10px; margin: 5px 0; border-radius: 5px; cursor: pointer; background: #f5f5f5;">
                            ${user.first_name || 'Неизвестно'} (ID: ${user.id})
                        </div>
                    `;
                });
                
                list.innerHTML = html;
            } catch (error) {
                console.error('Ошибка загрузки пользователей:', error);
                list.innerHTML = '<div class="error-message">Ошибка загрузки</div>';
            }
        }
        async function switchTab(tabId) {
            if (tabId === currentTab) return;
            const currentContent = document.getElementById(currentTab);
            const newContent = document.getElementById(tabId);
            currentContent.style.opacity = '0';
            currentContent.style.transform = 'translateX(-20px)';
            setTimeout(() => {
                currentContent.classList.remove('active');
                document.querySelectorAll('.tab').forEach(tab => {
                    tab.classList.remove('active');
                });
                document.querySelector(`.tab[onclick="switchTab('${tabId}')"]`).classList.add('active');
                newContent.classList.add('active');
                setTimeout(() => {
                    newContent.style.opacity = '1';
                    newContent.style.transform = 'translateX(0)';
                }, 10);
                currentTab = tabId;
                if (tabId === 'admin') {
                    if (adminPinVerified) {
                        document.getElementById('admin-pin-container').classList.add('hidden');
                        document.getElementById('admin-content-container').classList.remove('hidden');
                    } else {
                        document.getElementById('admin-pin-container').classList.remove('hidden');
                        document.getElementById('admin-content-container').classList.add('hidden');
                        if (!window.pinKeyboardInitialized) {
                            initPinKeyboard();
                            window.pinKeyboardInitialized = true;
                        }
                    }
                }
            }, 300);
        }
        function addGrade(grade) {
            if (!window.grades) window.grades = [];
            window.grades.push(grade);
            updateGradesDisplay();
        }

        function clearGrades() {
            window.grades = [];
            updateGradesDisplay();
        }

        function updateGradesDisplay() {
            const gradesDisplay = document.getElementById('grades-display');
            const averageGrade = document.getElementById('average-grade');
            if (window.grades.length === 0) {
                gradesDisplay.textContent = 'Оценки не добавлены';
                averageGrade.textContent = '';
            } else {
                gradesDisplay.textContent = window.grades.join(', ');
                const average = window.grades.reduce((a, b) => a + b, 0) / window.grades.length;
                averageGrade.textContent = `Средняя оценка: ${average.toFixed(2)}`;
            }
        }
        async function checkUserStatus(userId) {
            try {
                const { data, error } = await supabase
                    .from('users')
                    .select('status')
                    .eq('id', userId)
                    .single();
                
                if (error && error.code !== 'PGRST116') throw error;
                
                if (data) {
                    userStatus = data.status.toLowerCase();
                    isAdmin = ['admin', 'developer'].includes(userStatus);
                    
                    if (isAdmin) {
                        document.getElementById('admin-tab').classList.remove('hidden');
                    }
                    
                    return userStatus;
                }
                
                return 'user';
            } catch (error) {
                console.error('Ошибка проверки статуса пользователя:', error);
                return 'user';
            }
        }
        function initPinKeyboard() {
            const pinKeyboard = document.getElementById('pin-keyboard');
            const pinDisplay = document.getElementById('pin-display');
            const toggleVisibility = document.getElementById('toggle-visibility');
            const pinError = document.getElementById('pin-error');
            let pin = '';
            let isPinVisible = false;
            for (let i = 1; i <= 9; i++) {
                const button = document.createElement('div');
                button.className = 'pin-key';
                button.textContent = i;
                button.dataset.value = i;
                pinKeyboard.appendChild(button);
            }
            const button0 = document.createElement('div');
            button0.className = 'pin-key';
            button0.textContent = '0';
            button0.dataset.value = '0';
            pinKeyboard.appendChild(button0);
            
            const backspaceButton = document.createElement('div');
            backspaceButton.className = 'pin-key';
            backspaceButton.innerHTML = '<i class="fas fa-backspace"></i>';
            backspaceButton.dataset.action = 'backspace';
            pinKeyboard.appendChild(backspaceButton);
            
            const confirmButton = document.createElement('div');
            confirmButton.className = 'pin-key';
            confirmButton.innerHTML = '<i class="fas fa-check-circle"></i>';
            confirmButton.dataset.action = 'confirm';
            pinKeyboard.appendChild(confirmButton);
            pinKeyboard.addEventListener('click', (e) => {
                const target = e.target.closest('.pin-key');
                if (!target) return;
                const value = target.dataset.value;
                const action = target.dataset.action;
                if (value) {
                    if (pin.length < 4) {
                        pin += value;
                        updatePinDisplay();
                        target.style.transform = 'scale(0.95)';
                        setTimeout(() => {
                            target.style.transform = '';
                        }, 150);
                    }
                } else if (action === 'confirm') {
                    if (pin.length === 4) {
                        verifyAndUnlock();
                    } else {
                        showError('Пин-код должен содержать 4 цифры');
                    }
                } else if (action === 'backspace') {
                    pin = pin.slice(0, -1);
                    updatePinDisplay();
                    target.style.transform = 'scale(0.95)';
                    setTimeout(() => {
                        target.style.transform = '';
                    }, 150);
                }
            });
            toggleVisibility.addEventListener('click', () => {
                isPinVisible = !isPinVisible;
                updatePinDisplay();
                toggleVisibility.innerHTML = isPinVisible ? 
                    '<i class="fas fa-eye-slash"></i>' : 
                    '<i class="fas fa-eye"></i>';
                toggleVisibility.style.transform = 'scale(1.2)';
                setTimeout(() => {
                    toggleVisibility.style.transform = '';
                }, 200);
            });
            function updatePinDisplay() {
                pinDisplay.textContent = isPinVisible ? 
                    pin : 
                    pin.replace(/./g, '•');
            }
            async function verifyAndUnlock() {
                const isValid = await verifyPinCode(pin);
                if (isValid) {
                    adminPinVerified = true;
                    pinDisplay.style.background = 'rgba(40, 167, 69, 0.2)';
                    pinDisplay.innerHTML = '<i class="fas fa-check" style="font-size: 28px; color: #28a745;"></i>';
                    await logAction('admin_auth', {
                        method: 'pin_code',
                        success: true
                    });
                    
                    setTimeout(() => {
                        document.getElementById('admin-pin-container').classList.add('hidden');
                        document.getElementById('admin-content-container').classList.remove('hidden');
                        loadUsersList();
                    }, 800);
                } else {
                    await logAction('admin_auth_attempt', {
                        method: 'pin_code',
                        success: false,
                        attempted_pin: pin
                    });
                    showError('Неверный пин-код');
                    pin = '';
                    updatePinDisplay();
                    pinDisplay.style.background = 'rgba(220, 53, 69, 0.2)';
                    setTimeout(() => {
                        pinDisplay.style.background = 'rgba(var(--border-color-rgb), 0.05)';
                    }, 500);
                }
            }
            function showError(message) {
                showCustomAlert(message, 'error');
            }
        }
        async function verifyPinCode(enteredPin) {
            try {
                const { data, error } = await supabase
                    .from('admin_settings')
                    .select('pin_code')
                    .single();
                    
                if (error) {
                    if (error.code === 'PGRST116') {
                        const { data: newData, error: insertError } = await supabase
                            .from('admin_settings')
                            .insert([{ pin_code: '0000' }])
                            .select()
                            .single();
                            
                        if (insertError) throw insertError;
                        return newData.pin_code === enteredPin;
                    }
                    throw error;
                }
                return data.pin_code === enteredPin;
            } catch (error) {
                console.error('Ошибка проверки пин-кода:', error);
                showCustomAlert('Ошибка проверки пин-кода', 'error');
                return false;
            }
        }
        function shakePage() {
            document.body.classList.add('shake-page');
            setTimeout(() => {
            document.body.classList.remove('shake-page');
            }, 500);
        }
        async function createOrUpdateUser(user) {
            try {
                const { data: existingUser, error: fetchError } = await supabase
                    .from('users')
                    .select('*')
                    .eq('id', user.id.toString())
                    .maybeSingle();
                const updateData = {
                    username: user.username || null,
                    first_name: user.first_name || null,
                    last_name: user.last_name || null,
                    photo_url: user.photo_url || null,
                    last_seen: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                };
                if (fetchError) throw fetchError;
                if (existingUser) {
                    const { error } = await supabase
                        .from('users')
                        .update(updateData)
                        .eq('id', user.id.toString());
                    if (error) throw error;
                } else {
                    const { error } = await supabase
                        .from('users')
                        .insert({
                            ...updateData,
                            id: user.id.toString(),
                            theme: 'light',
                            animation_enabled: false,
                            gradient_enabled: false,
                            tags_enabled: true,
                            status: 'user',
                            created_at: new Date().toISOString()
                        });
                    if (error) throw error;
                }
            } catch (error) {
                console.error('Ошибка сохранения пользователя:', error);
            }
        }
        async function loadUserData() {
            let user;
            if (tg.initDataUnsafe?.user) {
                user = tg.initDataUnsafe.user;
            } else if (window.currentUserData) {
                user = window.currentUserData;
            } else {
                console.warn('Нет данных для отображения профиля');
                return;
            }

            let photoHtml = '';
            if (user.photo_url) {
                photoHtml = `<img src="${user.photo_url}" class="profile-photo" alt="Profile Photo">`;
            }

            const tagsEnabled = document.getElementById('tags-toggle').checked;
            const gradientEnabled = document.getElementById('gradient-toggle').checked;
            
            let statusBadge = '';
            if (tagsEnabled) {
                if (userStatus === 'developer') {
                    statusBadge = '<span class="user-status status-developer' + (gradientEnabled ? ' gradient' : '') + '">Разработчик</span>';
                } else if (userStatus === 'admin') {
                    statusBadge = '<span class="user-status status-admin' + (gradientEnabled ? ' gradient' : '') + '">Администратор</span>';
                } else {
                    statusBadge = '<span class="user-status status-user' + (gradientEnabled ? ' gradient' : '') + '">Пользователь</span>';
                }
            } else {
                statusBadge = userStatus === 'developer' ? 'Разработчик' : 
                            userStatus === 'admin' ? 'Администратор' : 'Пользователь';
            }
            document.getElementById('profile-content').innerHTML = `
                ${photoHtml}
                <div class="profile-info">
                    <div><strong>ID:</strong> ${user.id}</div>
                    <div><strong>Имя:</strong> ${user.first_name || 'Не указано'}</div>
                    <div><strong>Username:</strong> ${user.username ? '@' + user.username : 'Не указан'}</div>
                    <div><strong>Статус:</strong> ${statusBadge}</div>
                </div>
            `;
        }
        function updateTabBorders() {
            const tabs = document.querySelectorAll('.tab');
            tabs.forEach(tab => {
                if (document.body.classList.contains('light-purple-theme') || 
                    document.body.classList.contains('dark-purple-theme')) {
                    tab.style.animationPlayState = 'running';
                } else {
                    tab.style.animationPlayState = 'paused';
                }
            });
        }
        async function toggleBorderAnimation() {
            const isChecked = document.getElementById('border-animation-toggle').checked;
            document.documentElement.style.setProperty('--border-animation', isChecked ? 'borderPulse 4s linear infinite' : 'none');
            
            if (currentUserId && supabase) {
                try {
                    await supabase
                        .from('users')
                        .upsert({
                            id: currentUserId,
                            animation_enabled: isChecked,
                            updated_at: new Date().toISOString()
                        });
                    await logAction('settings_change', {
                        setting: 'border_animation',
                        value: isChecked,
                        section: 'appearance'
                    });
                } catch (error) {
                    console.error('Ошибка сохранения настроек анимации:', error);
                }
            }
        }
        
        async function initializeApp() {
            console.log("STEP0");
            const loadingScreen = document.getElementById('zenith-loader');
            const container = document.querySelector('.container');
            if (container) container.style.display = 'none';
            if (loadingScreen) {
                loadingScreen.style.display = 'flex';
                loadingScreen.style.opacity = '1';
            }
            console.log("STEP0,5");
            try {
                applyLoadingTheme('light');
            } catch (e) {
                document.documentElement.style.setProperty('--border-color', '#333');
                document.documentElement.style.setProperty('--background-color', '#f8f8f8');
                document.documentElement.style.setProperty('--text-color', '#333');
            }
            console.log("STEP1");
            let tgUser = null;
            let authMethod = null;
            try {
                supabase = await initSupabase();
                console.log("STEP2");
                if (tg.initDataUnsafe?.user) {
                    tgUser = tg.initDataUnsafe.user;
                    currentUserId = tgUser.id.toString();
                    authMethod = 'telegram';
                    console.log('✅ Telegram (initDataUnsafe)', currentUserId);
                }
                if (!currentUserId) {
                    const urlParams = new URLSearchParams(window.location.search);
                    const urlKey = urlParams.get('key') || urlParams.get('code');
                    if (urlKey && /^[a-zA-Z0-9]{20}$/.test(urlKey)) {
                        const { data: scbotRecord, error: scbotError } = await supabase
                            .from('scbot')
                            .select('user_id, act')
                            .eq('key', urlKey)
                            .single();
                        if (!scbotError && scbotRecord && scbotRecord.act) {
                            currentUserId = scbotRecord.user_id.toString();
                            localStorage.setItem('zenith_activation_key', urlKey);
                            authMethod = 'url_key';
                            console.log('✅ Авторизация через URL-ключ', currentUserId);
                        }
                    }
                }
                if (!currentUserId) {
                    let savedKey = localStorage.getItem('zenith_activation_key');
                    if (!savedKey) {
                        savedKey = localStorage.getItem('accessKey');
                    }

                    if (savedKey && /^[a-zA-Z0-9]{20}$/.test(savedKey)) {
                        const { data: scbotRecord, error: scbotError } = await supabase
                            .from('scbot')
                            .select('user_id, act')
                            .eq('key', savedKey)
                            .single();
                        if (!scbotError && scbotRecord && scbotRecord.act) {
                            currentUserId = scbotRecord.user_id.toString();
                            localStorage.setItem('zenith_activation_key', savedKey);
                            if (localStorage.getItem('accessKey') === savedKey) {
                                localStorage.removeItem('accessKey');
                            }
                            authMethod = 'saved_key';
                            console.log('✅ Авторизация через сохранённый ключ (из APK или сайта)', currentUserId);
                        } else {
                            localStorage.removeItem('zenith_activation_key');
                            localStorage.removeItem('accessKey');
                        }
                    }
                }
                if (!currentUserId) {
                    throw new Error('NO_AUTH');
                }
                console.log("STEP3");
                try {
                    const { data, error } = await supabase
                        .from('admin_settings')
                        .select('maintenance_mode, maintenance_since')
                        .single();
                    if (!error && data?.maintenance_mode) {
                        const { data: devCheck, error: devError } = await supabase
                            .from('users')
                            .select('status')
                            .eq('id', currentUserId)
                            .single();
                        const isDeveloper = devCheck?.status === 'developer';
                        if (!isDeveloper) {
                            const blocker = document.getElementById('maintenance-blocker');
                            const sinceEl = document.getElementById('maintenance-since-display');
                            if (data.maintenance_since) {
                                const since = new Date(data.maintenance_since).toLocaleString();
                                sinceEl.textContent = `Тех.работы начаты: ${since}`;
                            }
                            blocker.classList.remove('hidden');
                            document.querySelector('.container').style.display = 'none';
                            return;
                        }
                    }
                } catch (e) {
                    console.warn('Не удалось проверить режим тех.работ');
                }
                console.log("STEP4");
                const now = new Date().toISOString();
                const { data: existingUser, error: fetchError } = await supabase
                    .from('users')
                    .select('id')
                    .eq('id', currentUserId)
                    .maybeSingle();
                if (fetchError) throw fetchError;
                if (existingUser) {
                    const updateData = {
                        last_seen: new Date().toISOString(),
                        updated_at: new Date().toISOString()
                    };
                    if (tgUser) {
                        updateData.username = tgUser.username || null;
                        updateData.first_name = tgUser.first_name || null;
                        updateData.last_name = tgUser.last_name || null;
                        updateData.photo_url = tgUser.photo_url || null;
                    }
                    const { error: updateError } = await supabase
                        .from('users')
                        .update(updateData)
                        .eq('id', currentUserId);
                    if (updateError) throw updateError;
                } else {
                    const { error: insertError } = await supabase
                        .from('users')
                        .insert({
                            id: currentUserId,
                            username: tgUser?.username || null,
                            first_name: tgUser?.first_name || null,
                            last_name: tgUser?.last_name || null,
                            photo_url: tgUser?.photo_url || null,
                            last_seen: new Date().toISOString(),
                            created_at: new Date().toISOString(),
                            updated_at: new Date().toISOString(),
                            theme: 'light',
                            animation_enabled: false,
                            gradient_enabled: false,
                            tags_enabled: true,
                            status: 'user'
                        });
                    if (insertError) throw insertError;
                }
                console.log("STEP5");
                const { data: fullUserData, error: userDataError } = await supabase
                    .from('users')
                    .select('*')
                    .eq('id', currentUserId)
                    .single();
                if (userDataError || !fullUserData) {
                    console.warn('⚠️ Не удалось загрузить данные пользователя из sb');
                } else {
                    window.currentUserData = fullUserData;
                    console.log('✅ Полные данные пользователя загружены:', fullUserData);
                }
                userStatus = await checkUserStatus(currentUserId);
                isAdmin = ['admin', 'developer'].includes(userStatus);
                console.log("STEP6");
                try {await loadUserSettings();} catch (err) {console.warn('Не удалось загрузить настройки:', err);}
                await logAction('app_enter', {
                    user_status: userStatus,
                    is_admin: isAdmin,
                    auth_method: authMethod
                });
                console.log("STEP7");
                await loadUserData();
                initEventHandlers();
                if (userStatus === 'developer') {
                    document.getElementById('error-btn').classList.remove('hidden');
                }
                setTimeout(() => {
                    loadingScreen.style.opacity = '0';
                    setTimeout(() => {
                        loadingScreen.style.display = 'none';
                        showWelcomeScreen();
                    }, 500);
                }, 1200);

            } catch (error) {
                console.error('❌ Ошибка инициализации:', error);
                if (error.message === 'NO_AUTH') {
                    showActivationForm();
                } else {
                    showErrorToUser();
                }
            }
        }
        async function verifyActivationKey() {
            const input = document.getElementById('activation-key-input');
            const btn = document.getElementById('auth-submit-btn');
            const errorDiv = document.getElementById('activation-error');
            const key = input.value.trim();
            if (!/^[a-zA-Z0-9]{20}$/.test(key)) {
                errorDiv.textContent = 'Ключ должен состоять из 20 латинских букв и/или цифр.';
                return;
            }
            errorDiv.textContent = 'Проверка...';
            btn.disabled = true;
            try {
                const { data: scbotRecord, error: scbotError } = await supabase
                    .from('scbot')
                    .select('user_id, act')
                    .eq('key', key) 
                    .single();
                if (scbotError || !scbotRecord) {
                    throw new Error('Неверный ключ активации.');
                }
                if (!scbotRecord.act) {
                    throw new Error('Аккаунт не активирован.');
                }
                localStorage.setItem('zenith_activation_key', key);
                location.reload();
            } catch (err) {
                errorDiv.textContent = err.message;
                btn.disabled = false;
            }
        }
        function showActivationForm() {
            const loadingScreen = document.getElementById('zenith-loader');
            if (!loadingScreen) return;
            loadingScreen.style.pointerEvents = 'auto';
            const authForm = document.getElementById('zenith-auth-form');
            const mainLoader = document.querySelector('.zenith-loader, .zenith-status, .zenith-logo');
            if (mainLoader) {
                mainLoader.classList.add('hidden');
            }
            if (authForm) {
                authForm.classList.remove('hidden');
                const input = authForm.querySelector('#activation-code-input');
                const errorDiv = authForm.querySelector('#auth-error');
                const btn = authForm.querySelector('#auth-submit-btn');
                if (input) {
                    input.placeholder = '20 СИМВОЛОВ';
                    input.focus();
                }
                if (btn) {
                    btn.onclick = null;
                    btn.onclick = async () => {
                        const key = input.value.trim();
                        if (!/^[a-zA-Z0-9]{20}$/.test(key)) {
                            errorDiv.textContent = 'Ключ должен состоять из 20 латинских букв и/или цифр.';
                            errorDiv.style.display = 'block';
                            return;
                        }
                        errorDiv.style.display = 'none';
                        btn.disabled = true;
                        try {
                            const { data: scbotRecord, error: scbotError } = await supabase
                                .from('scbot')
                                .select('user_id, act')
                                .eq('key', key)
                                .single();
                            if (scbotError || !scbotRecord) {
                                throw new Error('Неверный ключ активации.');
                            }
                            if (!scbotRecord.act) {
                                throw new Error('Аккаунт не активирован.');
                            }
                            localStorage.setItem('zenith_activation_key', key);
                            location.reload();
                        } catch (err) {
                            errorDiv.textContent = err.message;
                            errorDiv.style.display = 'block';
                            btn.disabled = false;
                        }
                    };
                }
            }
        }
        async function applyTheme(theme, isUserAction = true) {
            document.body.className = theme + '-theme';
            document.querySelectorAll('.theme-option').forEach(option => {
                option.classList.remove('active');
            });
            document.querySelector(`.theme-${theme}`).classList.add('active');
            updateTabBorders();
            const iconsEnabled = document.getElementById('icons-toggle').checked;
            if (iconsEnabled) {
                document.body.classList.add('show-icons');
            } else {
                document.body.classList.remove('show-icons');
            }
            if (currentUserId && supabase) {
                try {
                    const { error } = await supabase
                        .from('users')
                        .upsert({
                            id: currentUserId,
                            theme: theme,
                            updated_at: new Date().toISOString()
                        }, { onConflict: 'id' });
                    if (error) throw error;
                    if (isUserAction) {
                        await logAction('settings_change', {
                            setting: 'theme',
                            value: theme,
                            section: 'appearance'
                        });
                    }
                } catch (error) {
                    console.error('Ошибка сохранения темы:', error);
                }
            }
            const themeNames = {
                'light': 'Светлая',
                'dark': 'Тёмная', 
                'light-purple': 'Светло-фиолетовая',
                'dark-purple': 'Тёмно-фиолетовая',
                'light-green': 'Светло-зелёная',
                'dark-green': 'Тёмно-зелёная',
                'light-red': 'Светло-красная',
                'dark-red': 'Тёмно-красная',
                'light-blue': 'Светло-синяя',
                'dark-blue': 'Тёмно-синяя',
                'light-pink': 'Светло-розовая',
                'dark-pink': 'Тёмно-розовая',
                'light-orange': 'Светло-оранжевая',
                'dark-orange': 'Тёмно-оранжевая',
            };
            showCustomAlert(`Тема изменена на ${themeNames[theme]}`, 'success');
            applyLoadingTheme(theme);
            updateTagsAppearance();
        }
        function switchEducationTab(tabId) {
            const educationContent = document.getElementById('education-content');
            const educationMain = document.getElementById('education-main');
            educationMain.style.opacity = '0';
            educationMain.style.transform = 'translateX(-20px)';

            setTimeout(() => {
                educationMain.style.display = 'none';
                educationContent.style.display = 'block';

                educationContent.style.opacity = '1';
                educationContent.style.transform = 'translateX(0)';

                let title = '';
                let contentHTML = '';

                if (tabId === 'schedule') {
                    loadScheduleContent();
                    return;
                } else if (tabId === 'grades') {
                    loadGradesContent();
                    return;
                } else if (tabId === 'homework') {
                    loadHomeworkContent();
                    return;
                } else if (tabId === 'biology') {
                    title = 'Биология';
                        contentHTML = `
                            <h3 style="text-align: center; margin-bottom: 20px; color: var(--border-color); font-size: 22px;">Клеточная теория и строение клетки</h3>

                        <div style="background: rgba(var(--border-color-rgb), 0.08); padding: 14px; border-radius: 12px; margin-bottom: 20px; border-left: 3px solid var(--border-color);">
                            Клеточная теория 1830–1831 была создана немецким ботаником Маттиасом Шлейденом и немецким зоологом/физиологом Теодором Шванном.
                        </div>

                        <h4 style="color: var(--border-color); margin: 25px 0 15px; font-size: 19px;">Основные положения клеточной теории</h4>
                        <ol style="padding-left: 20px; margin-bottom: 25px; line-height: 1.7; color: var(--text-color);">
                            <li><strong>Клетка</strong> — это структурно-функциональная единица жизни.</li>
                            <li><strong>Все живые организмы</strong> состоят из клеток.</li>
                            <li><strong>Клетки всех живых организмов</strong> сходны по строению и функциям.</li>
                            <li><strong>Каждая клетка</strong> происходит в ходе деления исходной материнской клетки.<br>
                                Это положение было дополнено позже в 1855 году Рудольфом Вирховым.</li>
                        </ol>

                        <div style="display: grid; gap: 16px; margin-bottom: 25px;">
                            <div style="background: rgba(var(--border-color-rgb), 0.1); padding: 14px; border-radius: 12px; border-left: 4px solid #28a745;">
                                <strong>1831 год</strong> — открыто ядро Робертом Броуном.
                            </div>
                            <div style="background: rgba(var(--border-color-rgb), 0.1); padding: 14px; border-radius: 12px; border-left: 4px solid #007bff;">
                                <strong>1865 год</strong> — Эрнст Геккель доказал участие ядра в передаче наследственной информации.
                            </div>
                            <div style="background: rgba(var(--border-color-rgb), 0.1); padding: 14px; border-radius: 12px; border-left: 4px solid #ffc107;">
                                <strong>1953–1954 годы</strong> — ДНК (единица наследственности) открыта Джеймсом Уотсоном и Фрэнсисом Криком.
                            </div>
                        </div>

                        <h4 style="color: var(--border-color); margin: 25px 0 15px; font-size: 19px;">Плазматическая мембрана</h4>
                        <ul style="padding-left: 20px; margin-bottom: 20px; line-height: 1.6; color: var(--text-color);">
                            <li><strong>Углеводы</strong> обеспечивают связь клеток друг с другом.</li>
                            <li><strong>Полуинтегральные и интегральные белки</strong> необходимы для транспорта веществ внутрь клетки.</li>
                            <li><strong>Гидрофильные головки</strong> ориентированы наружу и внутрь самой клетки, так как снаружи и внутри клетки имеется вода<br>
                                (<em>гидрофильные — любят воду</em>).</li>
                        </ul>

                        <h4 style="color: var(--border-color); margin: 25px 0 15px; font-size: 19px;">Функции мембраны</h4>
                        <ol style="padding-left: 20px; margin-bottom: 25px; line-height: 1.7; color: var(--text-color);">
                            <li><strong>Защита клетки</strong></li>
                            <li><strong>Избирательное проникновение веществ</strong> внутрь клетки</li>
                        </ol>

                        <h4 style="color: var(--border-color); margin: 25px 0 15px; font-size: 19px;">Транспорт веществ</h4>
                        <ol style="padding-left: 20px; margin-bottom: 25px; line-height: 1.7; color: var(--text-color);">
                            <li><strong>Диффузия</strong> — проникновение газов (O<sub>2</sub>, CO<sub>2</sub>), жирорастворимых веществ (спирт) через билипидный слой.</li>
                            <li><strong>Осмос</strong> — диффузия воды через клеточную мембрану.</li>
                            <li><strong>Пассивный транспорт</strong> через белковые каналы: глицерин, аминокислоты, глюкоза — без затрат энергии.</li>
                            <li><strong>Активный транспорт</strong> через белковые каналы или с помощью белков-переносчиков — с затратой энергии.</li>
                        </ol>

                        <div style="background: rgba(var(--border-color-rgb), 0.08); padding: 14px; border-radius: 12px; margin-bottom: 20px; border-left: 3px solid var(--border-color);">
                            <strong>Натрий-калиевый насос</strong> — снаружи клетки должно быть больше натрия, а внутри — больше калия. При нарушении этого соотношения включается насос, который проталкивает ионы калия внутрь клетки с затратой энергии.
                        </div>

                        <div style="background: rgba(var(--border-color-rgb), 0.08); padding: 14px; border-radius: 12px; margin-bottom: 20px; border-left: 3px solid var(--border-color);">
                            К белкам-переносчикам поступает молекула <strong>АТФ</strong> (аденозинтрифосфорная кислота). С помощью фермента <strong>АТФ-азы</strong> происходит высвобождение энергии, заключённой в молекуле АТФ.
                        </div>

                        <div style="background: rgba(var(--border-color-rgb), 0.08); padding: 14px; border-radius: 12px; margin-bottom: 20px; border-left: 3px solid var(--border-color);">
                            <strong>Белки-переносчики</strong> — специальные белки, которые захватывают молекулы, изменяют свою структуру и проходят сквозь билипидный слой. Перенос калия и натрия осуществляется именно с их помощью.
                        </div>

                        <h4 style="color: var(--border-color); margin: 25px 0 15px; font-size: 19px;">Растворы</h4>
                        <ol style="padding-left: 20px; margin-bottom: 25px; line-height: 1.7; color: var(--text-color);">
                            <li><strong>Гипертонический раствор</strong> — раствор, в котором концентрация солей (натрия и хлора) выше, чем в клетке.</li>
                            <li><strong>Изотонический раствор</strong> — концентрация солей равна внутри и снаружи клетки.</li>
                            <li><strong>Гипотонический раствор</strong> — концентрация солей ниже, чем в клетке.</li>
                        </ol>

                        <h4 style="color: var(--border-color); margin: 25px 0 15px; font-size: 19px;">Вопросы и ответы</h4>

                        <div style="display: grid; gap: 16px; margin-bottom: 25px;">
                            <div style="background: rgba(var(--border-color-rgb), 0.1); padding: 14px; border-radius: 12px; border-left: 4px solid #dc3545;">
                                <strong>1. Что произойдёт с эритроцитом в трёх типах растворов?</strong><br>
                                — В <strong>гипертоническом</strong> растворе вода выходит из эритроцита → клетка сморщивается (криноз).<br>
                                — В <strong>изотоническом</strong> растворе вода движется равномерно → форма не меняется.<br>
                                — В <strong>гипотоническом</strong> растворе вода поступает внутрь → клетка набухает и лопается (гемолиз).
                            </div>
                            <div style="background: rgba(var(--border-color-rgb), 0.1); padding: 14px; border-radius: 12px; border-left: 4px solid #6f42c1;">
                                <strong>2. Что такое плазмолиз?</strong><br>
                                Плазмолиз — отделение протопласта от клеточной стенки в растительной клетке при помещении её в гипертонический раствор.
                            </div>
                            <div style="background: rgba(var(--border-color-rgb), 0.1); padding: 14px; border-radius: 12px; border-left: 4px solid #20c997;">
                                <strong>3. Что значит «по градиенту» и «против градиента концентрации»?</strong><br>
                                — <strong>По градиенту</strong>: из области с большей концентрацией в область с меньшей (диффузия, пассивный транспорт).<br>
                                — <strong>Против градиента</strong>: из области с меньшей концентрацией в область с большей (активный транспорт, с затратой энергии).
                            </div>
                        </div>

                        <h4 style="color: var(--border-color); margin: 25px 0 15px; font-size: 19px;">Клеточная стенка (оболочка)</h4>
                        <p style="margin-bottom: 20px; line-height: 1.6; color: var(--text-color);">
                            Образуется поверх плазматической мембраны:
                        </p>
                        <ul style="padding-left: 20px; margin-bottom: 25px; line-height: 1.7; color: var(--text-color);">
                            <li>у <strong>растений</strong> — из <strong>целлюлозы</strong></li>
                            <li>у <strong>грибов</strong> — из <strong>хитина</strong></li>
                            <li>у <strong>бактерий</strong> — из <strong>муреина</strong></li>
                        </ul>

                        <div style="background: rgba(var(--border-color-rgb), 0.08); padding: 14px; border-radius: 12px; margin-bottom: 20px; border-left: 3px solid var(--border-color);">
                            На поверхности стенки есть <strong>поры</strong>, через которые нити цитоплазмы одной клетки проходят в другую. Образуется единая сеть — <strong>симпласт</strong>.
                        </div>
                        `;
                    } else if (tabId === 'geography') {
                        title = 'География';
                        contentHTML = `<p>Здесь пока пусто...</p>`;
                    } else if (tabId === 'algeb') {
                        title = 'Алгебра';
                        contentHTML = `
                            <h4 style="color: var(--border-color); margin: 25px 0 15px; font-size: 19px;">Формула 1</h4>
                            <div style="background: rgba(var(--border-color-rgb), 0.1); padding: 20px; border-radius: 12px; margin: 20px 0; text-align: center;">
                                <div class="katex-formula" style="font-size: 20px;">a^{\\frac{p}{q}} = \\sqrt[q]{a^p}</div>
                                <div class="katex-formula" style="font-size: 15px;">27^{\\frac{4}{3}} = \\left(27^{\\frac{1}{3}}\\right)^4 = \\left(\\sqrt[3]{27}\\right)^4 = 3^4 = 81</div>
                            </div>
                        `;
                        setTimeout(() => {
                            initKatex();
                        }, 100);
                    } else if (tabId === 'geometry') {
                        title = 'Геометрия';
                        contentHTML = `<p>Здесь пока пусто...</p>`;
                    } else if (tabId === 'fipi') {
                        title = 'ФИПИ / Геометрия';
                        contentHTML = `
                            <div style="display: flex; justify-content: center; gap: 8px;">
                                <button onclick="showFipiPage(1)" style="width: 32px; height: 32px; border-radius: 8px; background: var(--border-color); color: white; border: none; font-weight: bold;">6</button>
                                <button onclick="showFipiPage(2)" style="width: 32px; height: 32px; border-radius: 8px; background: rgba(var(--border-color-rgb), 0.1); color: var(--text-color); border: 1px solid var(--border-color); font-weight: bold;">7</button>
                                <button onclick="showFipiPage(3)" style="width: 32px; height: 32px; border-radius: 8px; background: rgba(var(--border-color-rgb), 0.1); color: var(--text-color); border: 1px solid var(--border-color); font-weight: bold;">8</button>
                                <button onclick="showFipiPage(4)" style="width: 32px; height: 32px; border-radius: 8px; background: rgba(var(--border-color-rgb), 0.1); color: var(--text-color); border: 1px solid var(--border-color); font-weight: bold;">9</button>
                                <button onclick="showFipiPage(5)" style="width: 32px; height: 32px; border-radius: 8px; background: rgba(var(--border-color-rgb), 0.1); color: var(--text-color); border: 1px solid var(--border-color); font-weight: bold;">10</button>
                            </div>
                            <div id="fipi-page-1" class="fipi-page" style="display: block;">
                                <div style="display: grid; gap: 12px; margin-bottom: 20px;">
                                    <a href="https://ege.sdamgia.ru/problem?id=665285" target="_blank" style="display: block; padding: 12px; background: rgba(var(--border-color-rgb), 0.08); border-radius: 12px; text-decoration: none; color: var(--text-color); border-left: 3px solid var(--border-color);">2 Задание [18]</a>
                                    <a href="https://math-ege.sdamgia.ru/problem?id=641148" target="_blank" style="display: block; padding: 12px; background: rgba(var(--border-color-rgb), 0.08); border-radius: 12px; text-decoration: none; color: var(--text-color); border-left: 3px solid var(--border-color);">5 Задание [24]</a>
                                    <a href="https://ege314.ru/prototip-2/reshenie-246/" target="_blank" style="display: block; padding: 12px; background: rgba(var(--border-color-rgb), 0.08); border-radius: 12px; text-decoration: none; color: var(--text-color); border-left: 3px solid var(--border-color);">10 Задание [56]</a>
                                </div>
                            </div>
                            <div id="fipi-page-2" class="fipi-page" style="display: none;">
                                <div style="display: grid; gap: 12px; margin-bottom: 20px;">
                                    <a href="https://www.euroki.org/koza/dve-storony-treugolnika-ravny--i--vysota-opuschennaya-na-bolshuyu-iz-etih-storon-ravna--naydite-dlinu" target="_blank" style="display: block; padding: 12px; background: rgba(var(--border-color-rgb), 0.08); border-radius: 12px; text-decoration: none; color: var(--text-color); border-left: 3px solid var(--border-color);">1 Задание [12]</a>
                                    <a href="https://www.euroki.org/koza/ostryy-ugol-b-pryamougolnogo-treugolnika-abc-raven-°-naydite-velichinu-ugla-mezhdu-vysotoy-ch-i-bisse" target="_blank" style="display: block; padding: 12px; background: rgba(var(--border-color-rgb), 0.08); border-radius: 12px; text-decoration: none; color: var(--text-color); border-left: 3px solid var(--border-color);">3 Задание [20]</a>
                                    <a href="https://www.euroki.org/koza/-dve-storony-treugolnika-ravny--i--vysota-opuschennaya-na-bolshuyu-iz-etih-storon-ravna--naydite-vyso" target="_blank" style="display: block; padding: 12px; background: rgba(var(--border-color-rgb), 0.08); border-radius: 12px; text-decoration: none; color: var(--text-color); border-left: 3px solid var(--border-color);">5 Задание [20]</a>
                                    <a href="https://self-edu.ru/ege2016_36.php?id=33_6" target="_blank" style="display: block; padding: 12px; background: rgba(var(--border-color-rgb), 0.08); border-radius: 12px; text-decoration: none; color: var(--text-color); border-left: 3px solid var(--border-color);">7 Задание [116]</a>
                                    <a href="https://www.bolshoyvopros.ru/questions/4633231-kak-reshit-dva-ugla-vpisannogo-v-okruzhnost-chetyrehugolnika-99-i-117.html" target="_blank" style="display: block; padding: 12px; background: rgba(var(--border-color-rgb), 0.08); border-radius: 12px; text-decoration: none; color: var(--text-color); border-left: 3px solid var(--border-color);">10 Задание [81]</a>
                                </div>
                            </div>
                            <div id="fipi-page-3" class="fipi-page" style="display: none;">
                                <div style="display: grid; gap: 12px; margin-bottom: 20px;">
                                    <a href="https://www.euroki.org/koza/storony-parallelogramma-ravny--i--vysota-opuschennaya-na-menshuyu-iz-etih-storon-ravna--naydite-dlinu" target="_blank" style="display: block; padding: 12px; background: rgba(var(--border-color-rgb), 0.08); border-radius: 12px; text-decoration: none; color: var(--text-color); border-left: 3px solid var(--border-color);">1 Задание [9]</a>
                                    <a href="https://ege.sdamgia.ru/problem?id=549312" target="_blank" style="display: block; padding: 12px; background: rgba(var(--border-color-rgb), 0.08); border-radius: 12px; text-decoration: none; color: var(--text-color); border-left: 3px solid var(--border-color);">3 Задание [6]</a>
                                    <a href="https://storage.yandexcloud.net/fotora.ru/uploads/72209af680551b48.png" target="_blank" style="display: block; padding: 12px; background: rgba(var(--border-color-rgb), 0.08); border-radius: 12px; text-decoration: none; color: var(--text-color); border-left: 3px solid var(--border-color);">6 Задание [58]</a>
                                    <a href="https://www.euroki.org/koza/ugol-aco-raven-°-ego-storona-ca-kasaetsya-okruzhnosti-s-tsentrom-v-tochke-o-otrezok-co-peresekaet-okr" target="_blank" style="display: block; padding: 12px; background: rgba(var(--border-color-rgb), 0.08); border-radius: 12px; text-decoration: none; color: var(--text-color); border-left: 3px solid var(--border-color);">7 Задание [33]</a>
                                </div>
                            </div>
                            <div id="fipi-page-4" class="fipi-page" style="display: none;">
                                <div style="display: grid; gap: 12px; margin-bottom: 20px;">
                                    <a href="https://self-edu.ru/ege2019_36.php?id=3_6" target="_blank" style="display: block; padding: 12px; background: rgba(var(--border-color-rgb), 0.08); border-radius: 12px; text-decoration: none; color: var(--text-color); border-left: 3px solid var(--border-color);">2 Задание [73]</a>
                                    <a href="https://www.bolshoyvopros.ru/questions/4155705-storony-paral-mma-24-i-27-vysota-opusch-na-storonu-18-kak-najti-drvysotu.html" target="_blank" style="display: block; padding: 12px; background: rgba(var(--border-color-rgb), 0.08); border-radius: 12px; text-decoration: none; color: var(--text-color); border-left: 3px solid var(--border-color);">6 Задание [16]</a>
                                    <a href="https://www.euroki.org/koza/131-tsentralnyy-ugol-na-32°-bolshe-ostrogo-vpisannogo-ugla-opirayuschegosya-na-tu-zhe-dugu-okruzhnost" target="_blank" style="display: block; padding: 12px; background: rgba(var(--border-color-rgb), 0.08); border-radius: 12px; text-decoration: none; color: var(--text-color); border-left: 3px solid var(--border-color);">9 Задание [32]</a>
                                    <a href="https://www.euroki.org/koza/naydite-velichinu-tsentralnogo-ugla-esli-on-na-°-bolshe-ostrogo-vpisannogo-ugla-opirayuschegosya-na-t" target="_blank" style="display: block; padding: 12px; background: rgba(var(--border-color-rgb), 0.08); border-radius: 12px; text-decoration: none; color: var(--text-color); border-left: 3px solid var(--border-color);">10 Задание [138]</a>
                                </div>
                            </div>
                            <div id="fipi-page-5" class="fipi-page" style="display: none;">
                                <div style="display: grid; gap: 12px; margin-bottom: 20px;">
                                    <a href="https://mathb-ege.sdamgia.ru/problem?id=525444" target="_blank" style="display: block; padding: 12px; background: rgba(var(--border-color-rgb), 0.08); border-radius: 12px; text-decoration: none; color: var(--text-color); border-left: 3px solid var(--border-color);">2 Задание [34]</a>
                                    <a href="https://ege.sdamgia.ru/problem?id=685341" target="_blank" style="display: block; padding: 12px; background: rgba(var(--border-color-rgb), 0.08); border-radius: 12px; text-decoration: none; color: var(--text-color); border-left: 3px solid var(--border-color);">4 Задание [40]</a>
                                    <a href="https://oge.sdamgia.ru/problem?id=348783" target="_blank" style="display: block; padding: 12px; background: rgba(var(--border-color-rgb), 0.08); border-radius: 12px; text-decoration: none; color: var(--text-color); border-left: 3px solid var(--border-color);">5 Задание [33]</a>
                                    <a href="https://storage.yandexcloud.net/fotora.ru/uploads/0bb143ed74670700.png" target="_blank" style="display: block; padding: 12px; background: rgba(var(--border-color-rgb), 0.08); border-radius: 12px; text-decoration: none; color: var(--text-color); border-left: 3px solid var(--border-color);">8 Задание [77]</a>
                                    <a href="https://mathb-ege.sdamgia.ru/problem?id=506788" target="_blank" style="display: block; padding: 12px; background: rgba(var(--border-color-rgb), 0.08); border-radius: 12px; text-decoration: none; color: var(--text-color); border-left: 3px solid var(--border-color);">9 Задание [25]</a>
                            </div>

                        `;
                    } else if (tabId === 'physics') {
                        title = 'Физика';
                        contentHTML = `
                        `;
                    } else {
                        title = 'Неизвестный раздел';
                        contentHTML = `<p>Раздел временно недоступен.</p>`;
                    }
                educationContent.innerHTML = '';
                if (title) {
                    const titleElement = document.createElement('h3');
                    titleElement.textContent = title;
                    titleElement.style.textAlign = 'center';
                    titleElement.style.marginBottom = '20px';
                    titleElement.style.color = 'var(--border-color)';
                    titleElement.style.fontSize = '22px';
                    educationContent.appendChild(titleElement);
                }

                const tempDiv = document.createElement('div');
                tempDiv.innerHTML = contentHTML;
                educationContent.appendChild(tempDiv);
                educationContent.innerHTML = '';
                educationContent.innerHTML = `
                                <div style="text-align: center; margin-bottom: 30px;">
                                    <button onclick="backToEducationMain()" class="back-btn" style="padding: 14px 28px; background: linear-gradient(135deg, var(--border-color), color-mix(in srgb, var(--border-color) 70%, black)); color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: bold; font-size: 16px; box-shadow: 0 6px 20px rgba(var(--border-color-rgb), 0.3); position: relative; overflow: hidden; transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1); display: block; margin: 0 auto;">
                                        <i class="fas fa-arrow-left" style="margin-right: 8px;"></i> Назад
                                    </button>
                                </div>
                                <div style="background: rgba(var(--border-color-rgb), 0.05); border-radius: 20px; padding: 25px; border: 2px solid var(--border-color);">
                                    <h3 style="text-align: center; margin-bottom: 20px; color: var(--border-color);">${title}</h3>
                                    <div>${contentHTML}</div>
                                </div>
                            `;
                logAction('education_section_view', { section: tabId });
                window.currentEducationSection = tabId;

            }, 150);
        }
        function showFipiPage(pageNum) {
            for (let i = 1; i <= 5; i++) {
                document.getElementById(`fipi-page-${i}`).style.display = i === pageNum ? 'block' : 'none';
            }
            const buttons = document.querySelectorAll('[onclick^="showFipiPage"]');
            buttons.forEach((btn, idx) => {
                if (idx + 1 === pageNum) {
                    btn.style.background = 'var(--border-color)';
                    btn.style.color = 'white';
                    btn.style.border = 'none';
                } else {
                    btn.style.background = 'rgba(var(--border-color-rgb), 0.1)';
                    btn.style.color = 'var(--text-color)';
                    btn.style.border = '1px solid var(--border-color)';
                }
            });
        }
        function loadHomeworkContent() {
            const educationContent = document.getElementById('education-content');
            // <div class="homework-day" onclick="switchHomeworkDay('monday')"
            // <div class="homework-day" onclick="switchHomeworkDay('tuesday')"
            // <div class="homework-day" onclick="switchHomeworkDay('wednesday')"
            // <div class="homework-day" onclick="switchHomeworkDay('thursday')"
            // <div class="homework-day" onclick="switchHomeworkDay('friday')"
            // <div class="homework-day" onclick="switchHomeworkDay('saturday')"
            
            educationContent.innerHTML = `
                <div style="text-align: center; margin-bottom: 30px;">
                    <button onclick="backToEducationMain()" class="back-btn" style="padding: 14px 28px; background: linear-gradient(135deg, var(--border-color), color-mix(in srgb, var(--border-color) 70%, black)); color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: bold; font-size: 16px; box-shadow: 0 6px 20px rgba(var(--border-color-rgb), 0.3); position: relative; overflow: hidden; transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1); display: block; margin: 0 auto;">
                        <i class="fas fa-arrow-left" style="margin-right: 8px;"></i> Назад
                    </button>
                </div>
                <div class="homework-days" style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px;">
                    <div class="homework-day feature-disabled" style="background: rgba(var(--border-color-rgb), 0.05); border-radius: 15px; padding: 20px; border: 2px solid var(--border-color); cursor: pointer; text-align: center; transition: all 0.3s ease; min-height: 120px; display: flex; flex-direction: column; justify-content: center; position: relative;">
                        <i class="fas fa-calendar-day" style="font-size: 32px; margin-bottom: 10px; color: var(--border-color);"></i>
                        <h4 style="margin-bottom: 10px; color: var(--border-color);">Понедельник</h4>
                        <div class="disabled-overlay">
                            <span>Недоступно</span>
                        </div>
                    </div>
                    <div class="homework-day feature-disabled" style="background: rgba(var(--border-color-rgb), 0.05); border-radius: 15px; padding: 20px; border: 2px solid var(--border-color); cursor: pointer; text-align: center; transition: all 0.3s ease; min-height: 120px; display: flex; flex-direction: column; justify-content: center; position: relative;">
                        <i class="fas fa-calendar-alt" style="font-size: 32px; margin-bottom: 10px; color: var(--border-color);"></i>
                        <h4 style="margin-bottom: 10px; color: var(--border-color);">Вторник</h4>
                        <div class="disabled-overlay">
                            <span>Недоступно</span>
                        </div>
                    </div>
                    <div class="homework-day feature-disabled" style="background: rgba(var(--border-color-rgb), 0.05); border-radius: 15px; padding: 20px; border: 2px solid var(--border-color); cursor: pointer; text-align: center; transition: all 0.3s ease; min-height: 120px; display: flex; flex-direction: column; justify-content: center; position: relative;">
                        <i class="fas fa-calendar-check" style="font-size: 32px; margin-bottom: 10px; color: var(--border-color);"></i>
                        <h4 style="margin-bottom: 10px; color: var(--border-color);">Среда</h4>
                        <div class="disabled-overlay">
                            <span>Недоступно</span>
                        </div>
                    </div>
                    <div class="homework-day feature-disabled" style="background: rgba(var(--border-color-rgb), 0.05); border-radius: 15px; padding: 20px; border: 2px solid var(--border-color); cursor: pointer; text-align: center; transition: all 0.3s ease; min-height: 120px; display: flex; flex-direction: column; justify-content: center;">
                        <i class="fas fa-calendar-week" style="font-size: 32px; margin-bottom: 10px; color: var(--border-color);"></i>
                        <h4 style="margin-bottom: 10px; color: var(--border-color);">Четверг</h4>
                        <div class="disabled-overlay">
                            <span>Недоступно</span>
                        </div>
                    </div>
                    <div class="homework-day" onclick="switchHomeworkDay('friday')" style="background: rgba(var(--border-color-rgb), 0.05); border-radius: 15px; padding: 20px; border: 2px solid var(--border-color); cursor: pointer; text-align: center; transition: all 0.3s ease; min-height: 120px; display: flex; flex-direction: column; justify-content: center; position: relative;">
                        <i class="fas fa-calendar" style="font-size: 32px; margin-bottom: 10px; color: var(--border-color);"></i>
                        <h4 style="margin-bottom: 10px; color: var(--border-color);">Пятница</h4>
                    </div>
                    <div class="homework-day feature-disabled" style="background: rgba(var(--border-color-rgb), 0.05); border-radius: 15px; padding: 20px; border: 2px solid var(--border-color); cursor: pointer; text-align: center; transition: all 0.3s ease; min-height: 120px; display: flex; flex-direction: column; justify-content: center; position: relative;">
                        <i class="fas fa-calendar-minus" style="font-size: 32px; margin-bottom: 10px; color: var(--border-color);"></i>
                        <h4 style="margin-bottom: 10px; color: var(--border-color);">Суббота</h4>
                        <div class="disabled-overlay">
                            <span>Недоступно</span>
                        </div>
                    </div>
                </div>
            `;
        }
        function switchHomeworkDay(day) {
            const educationContent = document.getElementById('education-content');
            
            educationContent.style.opacity = '0';
            educationContent.style.transform = 'translateX(-20px)';
            
            setTimeout(() => {
                logAction('homework_day_view', {
                    day: day
                });
                const dayContent = {
                    'monday': {
                        title: 'Понедельник',
                        subjects: [
                            {name: 'Английский язык', links: [
                                {text: 'текст', url: 'текст'}
                            ]},
                            {name: 'Русский язык', links: [
                                {text: 'текст', url: 'текст'}
                            ]},
                            {name: 'Физика', links: [
                                {text: 'текст', url: 'текст'}
                            ]}
                        ]
                    },
                    'tuesday': {
                        title: 'Вторник',
                        subjects: [
                            {name: 'Алгебра | Номер 10', links: [
                                {text: 'Пример 1-4', url: 'https://storage.yandexcloud.net/fotora.ru/uploads/248fb54d9fbecb28.png'},
                                {text: 'Пример 5-11', url: 'https://storage.yandexcloud.net/fotora.ru/uploads/0179fb9a546b3e11.png'},
                                {text: 'Пример 12-14', url: 'https://storage.yandexcloud.net/fotora.ru/uploads/bd54969fd20e7287.png'},
                            ]},
                            {name: 'Алгебра | Номер 12', links: [
                                {text: 'Пример 4-9', url: 'https://storage.yandexcloud.net/fotora.ru/uploads/8345d76e47bad434.png'},
                                {text: 'Пример 10-16', url: 'https://storage.yandexcloud.net/fotora.ru/uploads/49aef994e2e5f226.png'},
                                {text: 'Пример 17-23', url: 'https://storage.yandexcloud.net/fotora.ru/uploads/1616bce4a41d26fa.png'},
                            ]},
                            {name: 'Физика', links: [
                                {text: '47§', url: 'https://izi-otvet.ru/load/10_klass/fizika/kasjanov10kl47/98-1-0-19036'},
                                {text: '48§', url: 'https://storage.yandexcloud.net/fotora.ru/uploads/49aef994e2e5f226.png'},
                                {text: '49§', url: 'https://storage.yandexcloud.net/fotora.ru/uploads/1616bce4a41d26fa.png'},
                            ]}
                        ]
                    },
                    'wednesday': {
                        title: 'Среда',
                        subjects: [
                            {name: 'text', links: [
                                {text: 'text', url: 'text'}
                            ]}
                        ]
                    },
                    'thursday': {
                        title: 'Четверг',
                        subjects: [
                            {name: 'Английский язык', links: [
                                {text: 'упр8стр29 (пример)', url: 'https://reshak.ru/otvet/otvet_txt.php?otvet1=/spotlight10/images/module2/a/8'}
                            ]},
                            {name: 'География / Практическая [H]', links: [
                                {text: '2 задание / 1пример', url: 'https://i.postimg.cc/02qW9yFP/image.png'},
                                {text: '2 задание / 2пример', url: 'https://i.postimg.cc/V6vyBk10/image.png'},
                                {text: '3/4 задание / 1пример', url: 'https://i.postimg.cc/D0fScs0d/image.png'},
                                {text: '3/4 задание / 2пример', url: 'https://i.postimg.cc/FsV44qPY/image.png'},
                                {text: '5/6/вывод', url: 'https://i.postimg.cc/PqzZzdKt/image.png'}
                            ]},
                            {name: 'Геометрия', links: [
                                {text: 'текст', url: 'текст'}
                            ]},
                            {name: 'Физика ', links: [
                                {text: 'Решу ЕГЭ 10611121', url: 'https://phys-ege.sdamgia.ru/test?id=10611121'}
                            ],
                            text: "1) 20\n2) -0,5\n3) 0,7\n4) -2\n5) 5\n6) 100\n7) 4\n8) 1\n9) 150\n10) 2\n11) 5\n12) 8\n13) 24\n14) 0,4\n15) 50\n16) 14\n17) 234\n18) 14\n19) 14\n20) 34\n21) 34\n22) 13\n23) 22\n24) 24\n25) 22"}
                        ]
                    },
                    'friday': {
                        title: 'Пятница',
                        subjects: [
                            {name: 'Геометрия', links: [
                                {text: '№66', url: 'https://reshak.ru/otvet/reshebniki.php?otvet=new/66&predmet=atan10_11'},
                                {text: '№68', url: 'https://reshak.ru/otvet/reshebniki.php?otvet=new/68&predmet=atan10_11'},
                                {text: '№70', url: 'https://reshak.ru/otvet/reshebniki.php?otvet=new/70&predmet=atan10_11'}
                            ]},
                            {name: 'Алгебра', links: [
                                {text: '№86', url: 'https://reshak.ru/otvet/otvet8.php?otvet1=p86'},
                                {text: '№87', url: 'https://reshak.ru/otvet/otvet8.php?otvet1=p87'}
                            ]},
                            {name: 'Информатика', links: [
                                {text: '11) №110', url: 'https://storage.yandexcloud.net/fotora.ru/uploads/b105cc94b3582983.png'},
                                {text: 'Разбор (YT)', url: 'https://youtu.be/tO6WE74V54U'}
                            ]},
                            {name: 'Физика', links: [
                                {text: 'СР-15 / 3 Вариант', url: 'https://www.euroki.org/gdz/ru/fizika/9_klass/maron-111/samostoyatelnye-raboty-sr-15-stroenie-atoma-i-atomnogo-yadra-zadanie-variant-3'},
                                {text: 'СР-11 / 1 Вариант', url: 'https://www.euroki.org/gdz/ru/fizika/9_klass/maron-111/samostoyatelnye-raboty-sr-11-impuls-tela-zakon-sohraneniya-impulsa-zakon-sohraneniya-energii-zadanie-variant-1'},
                                {text: 'СР-11 / 2 Вариант', url: 'https://www.euroki.org/gdz/ru/fizika/9_klass/maron-111/samostoyatelnye-raboty-sr-11-impuls-tela-zakon-sohraneniya-impulsa-zakon-sohraneniya-energii-zadanie-variant-2'}
                            ]}
                            
                            /*,
                            {name: 'Биология', text: 'Ну конспект там в другом разделе...'}
                            */
                        ]
                    },
                    'saturday': {
                        title: 'Суббота',
                        subjects: [
                            {name: 'Алгебра', links: [
                                {text: '37.1', url: 'https://pomogalka.me/10-klass/algebra/mordkovich/zadacha-37-1/'},
                                {text: '37.2', url: 'https://pomogalka.me/10-klass/algebra/mordkovich/zadacha-37-2/'},
                                {text: '37.3', url: 'https://pomogalka.me/10-klass/algebra/mordkovich/zadacha-37-3/'},
                                {text: '37.4', url: 'https://pomogalka.me/10-klass/algebra/mordkovich/zadacha-37-4/'},
                                {text: '37.5', url: 'https://pomogalka.me/10-klass/algebra/mordkovich/zadacha-37-5/'},
                                {text: '37.6', url: 'https://pomogalka.me/10-klass/algebra/mordkovich/zadacha-37-6/'},
                                {text: '37.15', url: 'https://pomogalka.me/10-klass/algebra/mordkovich/zadacha-37-15/'},
                                {text: '37.16', url: 'https://pomogalka.me/10-klass/algebra/mordkovich/zadacha-37-16/'},
                                {text: '37.17', url: 'https://pomogalka.me/10-klass/algebra/mordkovich/zadacha-37-17/'},
                                {text: '37.18', url: 'https://pomogalka.me/10-klass/algebra/mordkovich/zadacha-37-18/'},
                                {text: '37.19', url: 'https://pomogalka.me/10-klass/algebra/mordkovich/zadacha-37-19/'},
                            ]}
                        ]
                    }
                };
                
                const dayData = dayContent[day];
                let subjectsHTML = '';
                
                dayData.subjects.forEach(subject => {
                    let contentHTML = '';
                    if (subject.links && subject.links.length > 0) {
                        subject.links.forEach(link => {
                            contentHTML += `
                                <a href="${link.url}" target="_blank" style="display: block; color: var(--border-color); text-decoration: none; font-size: 14px; margin: 5px 0; padding: 5px 10px; background: rgba(var(--border-color-rgb), 0.1); border-radius: 5px; transition: all 0.3s ease;">
                                    <i class="fas fa-external-link-alt" style="margin-right: 5px;"></i> ${link.text}
                                </a>
                            `;
                        });
                    }
                    if (subject.text) {
                        const lines = subject.text.split('\n');
                        lines.forEach(line => {
                            if (line.trim()) {
                                contentHTML += `
                                    <div style="display: block; color: var(--text-color); font-size: 14px; margin: 5px 0; padding: 5px 10px; background: rgba(var(--border-color-rgb), 0.05); border-radius: 5px; border-left: 3px solid var(--border-color);">
                                        ${line}
                                    </div>
                                `;
                            }
                        });
                    }
                    if (!subject.links && !subject.text && subject.link) {
                        contentHTML += `
                            <a href="${subject.link}" target="_blank" style="display: block; color: var(--border-color); text-decoration: none; font-size: 14px; margin: 5px 0; padding: 5px 10px; background: rgba(var(--border-color-rgb), 0.1); border-radius: 5px; transition: all 0.3s ease;">
                                <i class="fas fa-external-link-alt" style="margin-right: 5px;"></i> Ссылка на материалы
                            </a>
                        `;
                    }
                    subjectsHTML += `
                        <div style="margin-bottom: 15px; padding: 15px; background: rgba(var(--border-color-rgb), 0.1); border-radius: 10px; border-left: 4px solid var(--border-color);">
                            <h4 style="margin: 0 0 8px 0; color: var(--text-color);">${subject.name}</h4>
                            ${contentHTML}
                        </div>
                    `;
                });
                
                educationContent.innerHTML = `
                    <div style="text-align: center; margin-bottom: 30px;">
                        <button onclick="backToHomework()" class="back-btn" style="padding: 14px 28px; background: linear-gradient(135deg, var(--border-color), color-mix(in srgb, var(--border-color) 70%, black)); color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: bold; font-size: 16px; box-shadow: 0 6px 20px rgba(var(--border-color-rgb), 0.3); position: relative; overflow: hidden; transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1); display: block; margin: 0 auto;">
                            <i class="fas fa-arrow-left" style="margin-right: 8px;"></i> Назад
                        </button>
                    </div>
                    <div class="homework-content">
                        <h3 style="text-align: center; margin-bottom: 20px; color: var(--border-color);">Домашнее задание на ${dayData.title}</h3>
                        <div style="background: rgba(var(--border-color-rgb), 0.05); border-radius: 15px; padding: 20px; border: 2px solid var(--border-color);">
                            ${subjectsHTML}
                        </div>
                    </div>
                `;
                
                setTimeout(() => {
                    educationContent.style.opacity = '1';
                    educationContent.style.transform = 'translateX(0)';
                }, 10);
            }, 300);
        }

        function getDayName(day) {
            const days = {
                'monday': 'Понедельник',
                'tuesday': 'Вторник',
                'wednesday': 'Среду',
                'thursday': 'Четверг',
                'friday': 'Пятницу',
                'saturday': 'Субботу'
            };
            return days[day] || day;
        }

        function backToHomework() {
            const educationContent = document.getElementById('education-content');
            
            educationContent.style.opacity = '0';
            educationContent.style.transform = 'translateX(20px)';
            
            setTimeout(() => {
                loadHomeworkContent();
                
                setTimeout(() => {
                    educationContent.style.opacity = '1';
                    educationContent.style.transform = 'translateX(0)';
                }, 10);
            }, 300);
        }
        function loadScheduleContent() {
            const educationContent = document.getElementById('education-content');
            const scheduleData = {
                'Понедельник': [
                    {name: 'Английский язык', time: '09:05 - 09:45'},
                    {name: 'Русский язык', time: '10:00 - 10:40'},
                    {name: 'Физика', time: '10:55 - 11:35'},
                    {name: 'ИП (Информатика)', time: '11:50 - 12:30'},
                    {name: 'Английский язык', time: '12:45 - 13:25'}
                ],
                'Вторник': [
                    {name: 'Пр.Информатика', time: '08:30 - 09:15'},
                    {name: 'Физика', time: '09:30 - 10:15'},
                    {name: 'Литература', time: '10:30 - 11:15'},
                    {name: 'Физкультура', time: '11:35 - 12:20'},
                    {name: 'Алгебра', time: '12:35 - 13:20'},
                    {name: 'История', time: '13:30 - 14:15'}
                ],
                'Среда': [
                    {name: 'Родная литература', time: '08:30 - 09:15'},
                    {name: 'Алгебра', time: '09:30 - 10:15'},
                    {name: 'Химия', time: '10:30 - 11:15'},
                    {name: 'Физика', time: '11:35 - 12:20'},
                    {name: 'Обществознание', time: '12:35 - 13:20'},
                    {name: 'Алгебра', time: '13:30 - 14:15'},
                    {name: 'Родной язык', time: '14:25 - 15:10'}
                ],
                'Четверг': [
                    {name: 'Пр.Информатика', time: '08:30 - 09:10'},
                    {name: 'Английский язык', time: '09:25 - 10:05'},
                    {name: 'География', time: '10:20 - 11:00'},
                    {name: 'Физика', time: '11:15 - 11:55'},
                    {name: 'Геометрия', time: '12:10 - 12:50'},
                    {name: 'Геометрия', time: '13:40 - 14:20'}
                ],
                'Пятница': [
                    {name: 'Информатика', time: '08:30 - 09:15'},
                    {name: 'История', time: '09:30 - 10:15'},
                    {name: 'Физика', time: '10:30 - 11:15'},
                    {name: 'Алгебра', time: '11:35 - 12:20'},
                    {name: 'Литература', time: '12:35 - 13:20'},
                    {name: 'Биология', time: '13:30 - 14:15'},
                    {name: 'Геометрия', time: '14:25 - 15:10'}
                ],
                'Суббота': [
                    {name: 'Литература', time: '08:30 - 9:15'},
                    {name: 'Русский язык', time: '9:25 - 10:10'},
                    {name: 'Физкультура', time: '10:20 - 11:05'},
                    {name: 'ОБЖ', time: '11:15 - 12:00'},
                    {name: 'Обществознание', time: '12:10 - 12:55'},
                    {name: 'Вероятность', time: '13:00 - 13:45'}
                ]
            };

            let scheduleHTML = `
                <div style="text-align: center; margin-bottom: 30px;">
                    <button onclick="backToEducationMain()" class="back-btn" style="padding: 14px 28px; background: linear-gradient(135deg, var(--border-color), color-mix(in srgb, var(--border-color) 70%, black)); color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: bold; font-size: 16px; box-shadow: 0 6px 20px rgba(var(--border-color-rgb), 0.3); position: relative; overflow: hidden; transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1); display: block; margin: 0 auto;">
                        <i class="fas fa-arrow-left" style="margin-right: 8px;"></i> Назад
                    </button>
                </div>
                <div style="text-align: center; margin-bottom: 20px;">
                    <div style="display: inline-block;">
                        <button class="stats-filter-btn" onclick="toggleScheduleFilters()" style="padding: 10px 16px; background: linear-gradient(135deg, var(--border-color), color-mix(in srgb, var(--border-color) 70%, black)); color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: 600; display: inline-flex; align-items: center; gap: 8px; box-shadow: 0 4px 15px rgba(var(--border-color-rgb), 0.25); position: relative; overflow: hidden; transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);">
                            <i class="fas fa-filter" style="font-size: 14px;"></i>
                            <span style="font-size: 14px;">Фильтры</span>
                        </button>
                    </div>
                </div>
                <div id="schedule-filters" class="hidden" style="background: rgba(var(--border-color-rgb), 0.05); border-radius: 15px; padding: 20px; border: 2px solid var(--border-color); margin-bottom: 20px; transition: all 0.3s ease;">
                    <div style="margin-bottom: 15px;">
                        <h5 style="margin-bottom: 10px; color: var(--text-color); font-size: 14px; font-weight: 600; text-align: center;">Фильтр по дням</h5>
                        <div style="display: flex; flex-wrap: wrap; gap: 8px; justify-content: center;">
                            <button class="day-filter-btn active" data-day="all" style="padding: 6px 12px; background: var(--border-color); color: var(--button-text-color); border: none; border-radius: 6px; font-size: 12px; font-weight: 600; cursor: pointer; transition: all 0.2s ease;">
                                Все дни
                            </button>
                            <button class="day-filter-btn" data-day="Понедельник" style="padding: 6px 12px; background: rgba(var(--border-color-rgb), 0.1); color: var(--text-color); border: 1px solid var(--border-color); border-radius: 6px; font-size: 12px; font-weight: 600; cursor: pointer; transition: all 0.2s ease;">
                                Пн
                            </button>
                            <button class="day-filter-btn" data-day="Вторник" style="padding: 6px 12px; background: rgba(var(--border-color-rgb), 0.1); color: var(--text-color); border: 1px solid var(--border-color); border-radius: 6px; font-size: 12px; font-weight: 600; cursor: pointer; transition: all 0.2s ease;">
                                Вт
                            </button>
                            <button class="day-filter-btn" data-day="Среда" style="padding: 6px 12px; background: rgba(var(--border-color-rgb), 0.1); color: var(--text-color); border: 1px solid var(--border-color); border-radius: 6px; font-size: 12px; font-weight: 600; cursor: pointer; transition: all 0.2s ease;">
                                Ср
                            </button>
                            <button class="day-filter-btn" data-day="Четверг" style="padding: 6px 12px; background: rgba(var(--border-color-rgb), 0.1); color: var(--text-color); border: 1px solid var(--border-color); border-radius: 6px; font-size: 12px; font-weight: 600; cursor: pointer; transition: all 0.2s ease;">
                                Чт
                            </button>
                            <button class="day-filter-btn" data-day="Пятница" style="padding: 6px 12px; background: rgba(var(--border-color-rgb), 0.1); color: var(--text-color); border: 1px solid var(--border-color); border-radius: 6px; font-size: 12px; font-weight: 600; cursor: pointer; transition: all 0.2s ease;">
                                Пт
                            </button>
                            <button class="day-filter-btn" data-day="Суббота" style="padding: 6px 12px; background: rgba(var(--border-color-rgb), 0.1); color: var(--text-color); border: 1px solid var(--border-color); border-radius: 6px; font-size: 12px; font-weight: 600; cursor: pointer; transition: all 0.2s ease;">
                                Сб
                            </button>
                        </div>
                    </div>
                    <div>
                        <h5 style="margin-bottom: 10px; color: var(--text-color); font-size: 14px; font-weight: 600; text-align: center;">Фильтр по предметам</h5>
                        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px;">
                            <button class="subject-filter-btn active" data-subject="all" style="padding: 8px; background: var(--border-color); color: var(--button-text-color); border: none; border-radius: 6px; font-size: 12px; font-weight: 600; cursor: pointer; transition: all 0.2s ease;">
                                Все
                            </button>
                            <button class="subject-filter-btn" data-subject="Английский язык" style="padding: 8px; background: rgba(var(--border-color-rgb), 0.1); color: var(--text-color); border: 1px solid var(--border-color); border-radius: 6px; font-size: 12px; font-weight: 600; cursor: pointer; transition: all 0.2s ease;">
                                Английский
                            </button>
                            <button class="subject-filter-btn" data-subject="Русский язык" style="padding: 8px; background: rgba(var(--border-color-rgb), 0.1); color: var(--text-color); border: 1px solid var(--border-color); border-radius: 6px; font-size: 12px; font-weight: 600; cursor: pointer; transition: all 0.2s ease;">
                                Русский
                            </button>
                            <button class="subject-filter-btn" data-subject="Физика" style="padding: 8px; background: rgba(var(--border-color-rgb), 0.1); color: var(--text-color); border: 1px solid var(--border-color); border-radius: 6px; font-size: 12px; font-weight: 600; cursor: pointer; transition: all 0.2s ease;">
                                Физика
                            </button>
                            <button class="subject-filter-btn" data-subject="Информатика" style="padding: 8px; background: rgba(var(--border-color-rgb), 0.1); color: var(--text-color); border: 1px solid var(--border-color); border-radius: 6px; font-size: 12px; font-weight: 600; cursor: pointer; transition: all 0.2s ease;">
                                Информатика
                            </button>
                            <button class="subject-filter-btn" data-subject="Алгебра" style="padding: 8px; background: rgba(var(--border-color-rgb), 0.1); color: var(--text-color); border: 1px solid var(--border-color); border-radius: 6px; font-size: 12px; font-weight: 600; cursor: pointer; transition: all 0.2s ease;">
                                Алгебра
                            </button>
                            <button class="subject-filter-btn" data-subject="Геометрия" style="padding: 8px; background: rgba(var(--border-color-rgb), 0.1); color: var(--text-color); border: 1px solid var(--border-color); border-radius: 6px; font-size: 12px; font-weight: 600; cursor: pointer; transition: all 0.2s ease;">
                                Геометрия
                            </button>
                            <button class="subject-filter-btn" data-subject="Литература" style="padding: 8px; background: rgba(var(--border-color-rgb), 0.1); color: var(--text-color); border: 1px solid var(--border-color); border-radius: 6px; font-size: 12px; font-weight: 600; cursor: pointer; transition: all 0.2s ease;">
                                Литература
                            </button>
                            <button class="subject-filter-btn" data-subject="История" style="padding: 8px; background: rgba(var(--border-color-rgb), 0.1); color: var(--text-color); border: 1px solid var(--border-color); border-radius: 6px; font-size: 12px; font-weight: 600; cursor: pointer; transition: all 0.2s ease;">
                                История
                            </button>
                            <button class="subject-filter-btn" data-subject="Обществознание" style="padding: 8px; background: rgba(var(--border-color-rgb), 0.1); color: var(--text-color); border: 1px solid var(--border-color); border-radius: 6px; font-size: 12px; font-weight: 600; cursor: pointer; transition: all 0.2s ease;">
                                Общество
                            </button>
                            <button class="subject-filter-btn" data-subject="Химия" style="padding: 8px; background: rgba(var(--border-color-rgb), 0.1); color: var(--text-color); border: 1px solid var(--border-color); border-radius: 6px; font-size: 12px; font-weight: 600; cursor: pointer; transition: all 0.2s ease;">
                                Химия
                            </button>
                            <button class="subject-filter-btn" data-subject="Биология" style="padding: 8px; background: rgba(var(--border-color-rgb), 0.1); color: var(--text-color); border: 1px solid var(--border-color); border-radius: 6px; font-size: 12px; font-weight: 600; cursor: pointer; transition: all 0.2s ease;">
                                Биология
                            </button>
                            <button class="subject-filter-btn" data-subject="География" style="padding: 8px; background: rgba(var(--border-color-rgb), 0.1); color: var(--text-color); border: 1px solid var(--border-color); border-radius: 6px; font-size: 12px; font-weight: 600; cursor: pointer; transition: all 0.2s ease;">
                                География
                            </button>
                            <button class="subject-filter-btn" data-subject="Физкультура" style="padding: 8px; background: rgba(var(--border-color-rgb), 0.1); color: var(--text-color); border: 1px solid var(--border-color); border-radius: 6px; font-size: 12px; font-weight: 600; cursor: pointer; transition: all 0.2s ease;">
                                Физ-ра
                            </button>
                            <button class="subject-filter-btn" data-subject="ОБЖ" style="padding: 8px; background: rgba(var(--border-color-rgb), 0.1); color: var(--text-color); border: 1px solid var(--border-color); border-radius: 6px; font-size: 12px; font-weight: 600; cursor: pointer; transition: all 0.2s ease;">
                                ОБЖ
                            </button>
                            <button class="subject-filter-btn" data-subject="Вероятность" style="padding: 8px; background: rgba(var(--border-color-rgb), 0.1); color: var(--text-color); border: 1px solid var(--border-color); border-radius: 6px; font-size: 12px; font-weight: 600; cursor: pointer; transition: all 0.2s ease;">
                                Вероятность
                            </button>
                            <button class="subject-filter-btn" data-subject="Родная литература" style="padding: 8px; background: rgba(var(--border-color-rgb), 0.1); color: var(--text-color); border: 1px solid var(--border-color); border-radius: 6px; font-size: 12px; font-weight: 600; cursor: pointer; transition: all 0.2s ease;">
                                Род. лит.
                            </button>
                            <button class="subject-filter-btn" data-subject="Родной язык" style="padding: 8px; background: rgba(var(--border-color-rgb), 0.1); color: var(--text-color); border: 1px solid var(--border-color); border-radius: 6px; font-size: 12px; font-weight: 600; cursor: pointer; transition: all 0.2s ease;">
                                Род. яз.
                            </button>
                        </div>
                    </div>
                </div>

                <div class="schedule-container" style="display: grid; gap: 15px;">
            `;
            for (const [day, lessons] of Object.entries(scheduleData)) {
                scheduleHTML += `
                    <div class="schedule-day" data-day="${day}" style="background: rgba(var(--border-color-rgb), 0.05); border-radius: 15px; padding: 15px; border: 2px solid var(--border-color); display: none;"> <!-- Изначально скрыт, будет показан при фильтрации -->
                        <h4 style="margin-bottom: 12px; color: var(--border-color); text-align: center; font-size: 16px;">${day}</h4>
                        <div class="lessons-list" style="display: grid; gap: 10px;">
                `;
                lessons.forEach((lesson, index) => {
                    scheduleHTML += `
                        <div class="lesson-item" data-subject="${lesson.name}" style="display: flex; justify-content: space-between; align-items: center; padding: 10px; background: rgba(var(--border-color-rgb), 0.1); border-radius: 8px;">
                            <div style="flex: 1;">
                                <strong style="font-size: 14px;">${index + 1}. ${lesson.name}</strong>
                                <div style="font-size: 12px; color: var(--text-color); opacity: 0.8;">${lesson.time}</div>
                            </div>
                            <div class="lesson-time" style="background: var(--border-color); color: var(--button-text-color); padding: 4px 8px; border-radius: 6px; font-size: 11px; font-weight: bold;">
                                ${lesson.time.split(' - ')[0]}
                            </div>
                        </div>
                    `;
                });
                scheduleHTML += `
                        </div>
                    </div>
                `;
            }
            scheduleHTML += `</div>`;
            educationContent.innerHTML = scheduleHTML;
            window.currentDayFilter = 'all';
            window.currentSubjectFilter = 'all';
            document.querySelectorAll('.day-filter-btn').forEach(button => {
                button.addEventListener('click', function() {
                    document.querySelectorAll('.day-filter-btn').forEach(btn => {
                        btn.classList.remove('active');
                        btn.style.background = 'rgba(var(--border-color-rgb), 0.1)';
                        btn.style.color = 'var(--text-color)';
                        btn.style.border = '1px solid var(--border-color)';
                    });
                    this.classList.add('active');
                    this.style.background = 'var(--border-color)';
                    this.style.color = 'var(--button-text-color)';
                    this.style.border = 'none';
                    window.currentDayFilter = this.getAttribute('data-day');
                    applyScheduleFilters();
                });
            });
            document.querySelectorAll('.subject-filter-btn').forEach(button => {
                button.addEventListener('click', function() {
                    document.querySelectorAll('.subject-filter-btn').forEach(btn => {
                        btn.classList.remove('active');
                        btn.style.background = 'rgba(var(--border-color-rgb), 0.1)';
                        btn.style.color = 'var(--text-color)';
                        btn.style.border = '1px solid var(--border-color)';
                    });
                    this.classList.add('active');
                    this.style.background = 'var(--border-color)';
                    this.style.color = 'var(--button-text-color)';
                    this.style.border = 'none';
                    window.currentSubjectFilter = this.getAttribute('data-subject');
                    applyScheduleFilters();
                });
            });
            applyScheduleFilters();
        }
        async function loadMaintenanceMode() {
            try {
                const { data, error } = await supabase
                    .from('admin_settings')
                    .select('maintenance_mode, maintenance_since')
                    .single();
                if (error) throw error;
                const toggle = document.getElementById('maintenance-toggle');
                const statusText = document.getElementById('maintenance-status-text');
                const infoBlock = document.getElementById('maintenance-info');
                const sinceText = document.getElementById('maintenance-since-text');
                toggle.checked = data.maintenance_mode;
                statusText.textContent = data.maintenance_mode ? 'Закрыт (тех.работы)' : 'Открыт';
                statusText.style.color = data.maintenance_mode ? '#dc3545' : '#28a745';
                if (data.maintenance_mode && data.maintenance_since) {
                    const since = new Date(data.maintenance_since).toLocaleString();
                    sinceText.textContent = `Объявлены: ${since}`;
                    infoBlock.style.display = 'block';
                } else {
                    infoBlock.style.display = 'none';
                }
                loadMaintenanceLog();
            } catch (err) {
                console.error('Ошибка загрузки режима:', err);
                showCustomAlert('Не удалось загрузить режим тех.работ', 'error');
            }
        }
        async function toggleMaintenanceMode() {
            const isChecked = document.getElementById('maintenance-toggle').checked;
            try {
                const now = isChecked ? new Date().toISOString() : null;
                const { data: existing, error: fetchError } = await supabase
                    .from('admin_settings')
                    .select('id')
                    .limit(1)
                    .single();

                if (fetchError) throw fetchError;
                const { error: updateError } = await supabase
                    .from('admin_settings')
                    .update({
                        maintenance_mode: isChecked,
                        maintenance_since: now
                    })
                    .eq('id', existing.id);
                if (updateError) throw updateError;
                await supabase.from('maintenance_log').insert({
                    enabled: isChecked,
                    changed_at: now
                });
                await logAction('admin_maintenance_toggle', {
                    enabled: isChecked,
                    timestamp: now
                });
                showCustomAlert(isChecked ? 'Режим тех.работ включён' : 'Проект снова открыт', 'success');
                loadMaintenanceMode();

            } catch (err) {
                console.error('Ошибка переключения режима:', err);
                showCustomAlert('Не удалось сохранить режим', 'error');
            }
        }
        async function loadMaintenanceLog() {
            const listEl = document.getElementById('maintenance-log-list');
            listEl.innerHTML = '<div class="admin-loading"><div class="admin-loading-spinner"></div><div class="admin-loading-text">Загрузка логов режимов...</div></div>';
            try {
                const { data, error } = await supabase
                    .from('maintenance_log')
                    .select('*')
                    .order('changed_at', { ascending: false })
                    .limit(10);

                if (error && error.code !== 'PGRST116') throw error;

                if (!data || data.length === 0) {
                    listEl.innerHTML = '<div style="text-align: center; opacity: 0.7;">Нет записей</div>';
                    return;
                }
                let html = '';
                data.forEach(log => {
                    const time = new Date(log.changed_at).toLocaleString();
                    const status = log.enabled ? '🔴 Закрыт' : '🟢 Открыт';
                    html += `
                        <div class="admin-item" style="padding: 14px; background: rgba(var(--border-color-rgb), 0.05);">
                            <div>
                                <strong>${status}</strong>
                            </div>
                            <div style="font-size: 13px; opacity: 0.8;">${time}</div>
                        </div>
                    `;
                });
                listEl.innerHTML = html;
            } catch (err) {
                console.error('Ошибка загрузки лога режимов:', err);
                listEl.innerHTML = '<div style="color: #dc3545; text-align: center;">Ошибка загрузки</div>';
            }
        }
        async function ensureMaintenanceLogTable() {
            try {
                const { data, error } = await supabase
                    .from('maintenance_log')
                    .select('id')
                    .limit(1);
                if (error && error.code === 'PGRST116') {
                    console.warn('Таблица maintenance_log отсутствует. Создай её в Supabase.');
                }
            } catch (e) {
                console.error(e);
            }
        }
        function toggleScheduleFilters() {
            const filters = document.getElementById('schedule-filters');
            filters.classList.toggle('hidden');
        }
        function applyScheduleFilters() {
            const dayFilter = window.currentDayFilter || 'all';
            const subjectFilter = window.currentSubjectFilter || 'all';
            
            const dayBlocks = document.querySelectorAll('.schedule-day');
            
            dayBlocks.forEach(dayBlock => {
                const dayName = dayBlock.getAttribute('data-day');
                const lessonItems = dayBlock.querySelectorAll('.lesson-item');
                let hasVisibleLessons = false;
                lessonItems.forEach(lesson => {
                    const lessonSubject = lesson.getAttribute('data-subject');
                    
                    if ((subjectFilter === 'all' || lessonSubject === subjectFilter) && 
                        (dayFilter === 'all' || dayName === dayFilter)) {
                        lesson.style.display = 'flex';
                        hasVisibleLessons = true;
                    } else {
                        lesson.style.display = 'none';
                    }
                });
                if (hasVisibleLessons) {
                    dayBlock.style.display = 'block';
                } else {
                    dayBlock.style.display = 'none';
                }
            });
        }
        function filterScheduleBySubject(subject) {
            const lessonItems = document.querySelectorAll('.lesson-item');
            
            lessonItems.forEach(lesson => {
                if (subject === 'all' || lesson.getAttribute('data-subject') === subject) {
                    lesson.style.display = 'flex';
                    lesson.style.opacity = '1';
                } else {
                    lesson.style.display = 'none';
                }
            });
        }
        function loadGradesContent() {
            const educationContent = document.getElementById('education-content');
            educationContent.innerHTML = `
                <div style="text-align: center; margin-bottom: 30px;">
                    <button onclick="backToEducationMain()" class="back-btn" style="padding: 14px 28px; background: linear-gradient(135deg, var(--border-color), color-mix(in srgb, var(--border-color) 70%, black)); color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: bold; font-size: 16px; box-shadow: 0 6px 20px rgba(var(--border-color-rgb), 0.3); position: relative; overflow: hidden; transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1); display: block; margin: 0 auto;">
                        <i class="fas fa-arrow-left" style="margin-right: 8px;"></i> Назад
                    </button>
                </div>
                <div class="grades-container" style="background: rgba(var(--border-color-rgb), 0.05); border-radius: 20px; padding: 30px; border: 3px solid var(--border-color); box-shadow: 0 8px 30px rgba(var(--border-color-rgb), 0.2);">
                    <div style="text-align: center; margin-bottom: 30px;">
                        <div style="font-size: 24px; font-weight: 800; margin-bottom: 20px; background: linear-gradient(to right, var(--text-color), var(--border-color)); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;">Ваши оценки</div>
                        <div id="grades-display" style="font-size: 18px; min-height: 40px; margin-bottom: 25px; padding: 15px; background: rgba(var(--border-color-rgb), 0.1); border-radius: 15px; border: 2px solid var(--border-color); display: flex; justify-content: center; align-items: center; flex-wrap: wrap; gap: 10px; box-shadow: inset 0 0 10px rgba(var(--border-color-rgb), 0.1);">
                            Оценки не добавлены
                        </div>
                        <div id="average-grade" style="font-size: 32px; font-weight: 800; padding: 15px; background: rgba(var(--border-color-rgb), 0.1); border-radius: 15px; border: 3px solid var(--border-color); box-shadow: 0 0 15px rgba(var(--border-color-rgb), 0.2);"></div>
                    </div>
                    <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; margin-bottom: 20px;">
                        <button class="grade-btn" onclick="addGrade(1)" style="padding: 20px; background: linear-gradient(135deg, #dc3545, #c82333); color: white; border: none; border-radius: 15px; font-size: 24px; font-weight: bold; cursor: pointer; box-shadow: 0 6px 20px rgba(220, 53, 69, 0.4); transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1); position: relative; overflow: hidden;">
                            <span style="position: relative; z-index: 1;">1</span>
                        </button>
                        <button class="grade-btn" onclick="addGrade(2)" style="padding: 20px; background: linear-gradient(135deg, #fd7e14, #e07107); color: white; border: none; border-radius: 15px; font-size: 24px; font-weight: bold; cursor: pointer; box-shadow: 0 6px 20px rgba(253, 126, 20, 0.4); transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1); position: relative; overflow: hidden;">
                            <span style="position: relative; z-index: 1;">2</span>
                        </button>
                        <button class="grade-btn" onclick="addGrade(3)" style="padding: 20px; background: linear-gradient(135deg, #ffc107, #e0a800); color: #212529; border: none; border-radius: 15px; font-size: 24px; font-weight: bold; cursor: pointer; box-shadow: 0 6px 20px rgba(255, 193, 7, 0.4); transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1); position: relative; overflow: hidden;">
                            <span style="position: relative; z-index: 1;">3</span>
                        </button>
                        <button class="grade-btn" onclick="addGrade(4)" style="padding: 20px; background: linear-gradient(135deg, #20c997, #198754); color: white; border: none; border-radius: 15px; font-size: 24px; font-weight: bold; cursor: pointer; box-shadow: 0 6px 20px rgba(32, 201, 151, 0.4); transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1); position: relative; overflow: hidden;">
                            <span style="position: relative; z-index: 1;">4</span>
                        </button>
                        <button class="grade-btn" onclick="addGrade(5)" style="padding: 20px; background: linear-gradient(135deg, #28a745, #218838); color: white; border: none; border-radius: 15px; font-size: 24px; font-weight: bold; cursor: pointer; box-shadow: 0 6px 20px rgba(40, 167, 69, 0.4); transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1); position: relative; overflow: hidden;">
                            <span style="position: relative; z-index: 1;">5</span>
                        </button>
                        <button class="grade-btn" onclick="removeLastGrade()" style="padding: 20px; background: linear-gradient(135deg, #6f42c1, #5a32a3); color: white; border: none; border-radius: 15px; font-size: 24px; font-weight: bold; cursor: pointer; box-shadow: 0 6px 20px rgba(111, 66, 193, 0.4); transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1); position: relative; overflow: hidden;">
                            <i class="fas fa-backspace" style="position: relative; z-index: 1;"></i>
                        </button>
                    </div>
                    <button class="clear-btn" onclick="clearGrades()" style="padding: 18px; background: linear-gradient(135deg, #dc3545, #c82333); color: white; border: none; border-radius: 15px; font-size: 18px; font-weight: bold; cursor: pointer; box-shadow: 0 6px 20px rgba(220, 53, 69, 0.4); transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1); width: 100%; text-transform: uppercase; letter-spacing: 1px;">
                        <i class="fas fa-trash" style="margin-right: 8px;"></i> Удалить все оценки
                    </button>
                </div>
            `;
            if (!window.grades) {
                window.grades = [];
            }
            updateGradesDisplay();
        }
        function removeLastGrade() {
            if (window.grades && window.grades.length > 0) {
                window.grades.pop();
                updateGradesDisplay();
            }
        }
        function backToEducationMain() {
            const educationContent = document.getElementById('education-content');
            const educationMain = document.getElementById('education-main');
            
            educationContent.style.opacity = '0';
            educationContent.style.transform = 'translateX(20px)';
            
            setTimeout(() => {
                educationContent.style.display = 'none';
                educationMain.style.display = 'block';
                
                setTimeout(() => {
                    educationMain.style.opacity = '1';
                    educationMain.style.transform = 'translateX(0)';
                }, 10);
            }, 300);
        }

        function addGrade(grade) {
            if (!window.grades) {
                window.grades = [];
            }
            window.grades.push(grade);
            updateGradesDisplay();
        }

        function clearGrades() {
            window.grades = [];
            updateGradesDisplay();
        }

        function updateGradesDisplay() {
            const gradesDisplay = document.getElementById('grades-display');
            const averageGrade = document.getElementById('average-grade');
            
            if (!gradesDisplay || !averageGrade) return;
            
            if (window.grades.length === 0) {
                gradesDisplay.innerHTML = '<span style="opacity: 0.7;">Оценки не добавлены</span>';
                averageGrade.textContent = '';
                averageGrade.style.borderColor = 'var(--border-color)';
            } else {
                gradesDisplay.innerHTML = window.grades.map(grade => 
                    `<span style="display: inline-block; padding: 4px 8px; background: rgba(var(--border-color-rgb), 0.2); border-radius: 6px; font-weight: bold;">${grade}</span>`
                ).join('');
                
                const average = window.grades.reduce((a, b) => a + b, 0) / window.grades.length;
                averageGrade.textContent = `Средняя: ${average.toFixed(2)}`;
                
                let color;
                if (average >= 4.6) color = '#28a745';
                else if (average >= 3.6) color = '#198754';
                else if (average >= 2.6) color = '#ffc107';
                else if (average >= 1.6) color = '#fd7e14';
                else color = '#dc3545';
                
                averageGrade.style.color = color;
                averageGrade.style.borderColor = color;
            }
        }
        function applyLoadingTheme(theme) {
            const loadingScreen = document.getElementById('zenith-loader');
            const particles = document.querySelectorAll('.loader-particle');
            const percentage = document.getElementById('loader-percent');
            const signature = document.querySelector('.loader-signature');
            if (loadingScreen) {
                loadingScreen.style.backgroundColor = getComputedStyle(document.body).getPropertyValue('--background-color');
            }
            if (percentage) {
                const themeColor = getComputedStyle(document.body).getPropertyValue('--border-color');
                percentage.style.color = themeColor;
                percentage.style.textShadow = `0 0 20px rgba(${getComputedStyle(document.body).getPropertyValue('--border-color-rgb')}, 0.7)`;
            }
            if (signature) {
                signature.style.color = getComputedStyle(document.body).getPropertyValue('--text-color');
                signature.style.textShadow = `0 0 5px rgba(${getComputedStyle(document.body).getPropertyValue('--border-color-rgb')}, 0.3)`;
            }
            particles.forEach(particle => {
                const borderColor = getComputedStyle(document.body).getPropertyValue('--border-color');
                const borderColorRgb = getComputedStyle(document.body).getPropertyValue('--border-color-rgb');
                particle.style.background = borderColor;
                particle.style.filter = 'blur(1px)';
                particle.style.boxShadow = `0 0 15px ${borderColor}, 0 0 30px rgba(${borderColorRgb}, 0.5)`;
            });
        }
        function showWelcomeScreen() {
            const loader = document.getElementById('zenith-loader');
            const welcomeScreen = document.getElementById('welcome-screen');
            const welcomeText = document.getElementById('welcome-text');
            const container = document.querySelector('.container');
            const borderColor = getComputedStyle(document.body).getPropertyValue('--border-color');
            const textColor = getComputedStyle(document.body).getPropertyValue('--text-color');
            welcomeScreen.style.display = 'flex';
            welcomeScreen.style.opacity = '0';
            let firstName = 'Пользователь';
            if (tg.initDataUnsafe?.user?.first_name) {
                firstName = tg.initDataUnsafe.user.first_name;
            }
            else if (window.currentUserData?.first_name) {
                firstName = window.currentUserData.first_name;
            }
            if (welcomeText) {
                welcomeText.innerHTML = `Привет, <span style="color: ${borderColor};">${firstName}</span>`;
                welcomeText.style.color = textColor;
            }
            setTimeout(() => {
                welcomeScreen.style.opacity = '1';
            }, 10);
            setTimeout(() => {
                if (loader) loader.style.opacity = '0';
                setTimeout(() => {
                    if (loader) loader.style.display = 'none';
                }, 500);
            }, 3200);
            setTimeout(() => {
                welcomeScreen.style.opacity = '0';
                setTimeout(() => {
                    welcomeScreen.style.display = 'none';
                    container.style.display = 'block';
                }, 500);
            }, 2000); 
        }
        async function logAction(action, details = {}) {
            if (!document.getElementById('logging-toggle').checked) {
                return;
            }
            if (!currentUserId || !supabase) return;
            try {
                const { error } = await supabase
                    .from('user_logs')
                    .insert({
                        user_id: currentUserId,
                        action: action,
                        details: details,
                        user_agent: navigator.userAgent
                    });
                if (error) throw error;
            } catch (error) {
                console.error('Ошибка записи лога:', error);
            }
        }
        async function loadUserSettings() {
            if (!currentUserId || !supabase) return;
            try {
                const { data, error } = await supabase
                    .from('users')
                    .select('theme, animation_enabled, gradient_enabled, tags_enabled, icons_enabled, logging_enabled')
                    .eq('id', currentUserId)
                    .single();
                if (error) throw error;
                applyTheme(data.theme, false);
                document.getElementById('border-animation-toggle').checked = data.animation_enabled === true;
                const gradientToggle = document.getElementById('gradient-toggle');
                const tagsToggle = document.getElementById('tags-toggle');
                const iconsToggle = document.getElementById('icons-toggle');

                if (gradientToggle) gradientToggle.checked = data.gradient_enabled === true;
                if (tagsToggle) tagsToggle.checked = data.tags_enabled !== false;
                if (iconsToggle) iconsToggle.checked = data.icons_enabled !== false;
                document.getElementById('logging-toggle').checked = data.logging_enabled !== false;
                if (!data.tags_enabled) {
                    document.body.classList.add('hide-tags');
                } else {
                    document.body.classList.remove('hide-tags');
                }

                updateIcons();
                updateTagsAppearance();
                updateBorderAnimation();

            } catch (error) {
                console.error('Ошибка загрузки настроек:', error);
                document.getElementById('border-animation-toggle').checked = false;
                document.getElementById('gradient-toggle').checked = false;
                document.getElementById('tags-toggle').checked = true;
                document.getElementById('icons-toggle').checked = false;
                document.getElementById('logging-toggle').checked = true;
                document.body.classList.remove('hide-tags');
                document.body.classList.remove('show-icons');
                removeIcons();
                
                if (userStatus !== 'developer') {
                    document.getElementById('logging-toggle').disabled = true;
                    document.querySelector('#logging-toggle-container .disabled-overlay').style.display = 'flex';
                }
                
                updateTagsAppearance();
                updateBorderAnimation();
            }
        }
        function updateBorderAnimation() {
            const isChecked = document.getElementById('border-animation-toggle').checked;
            document.documentElement.style.setProperty('--border-animation', isChecked ? 'borderPulse 4s linear infinite' : 'none');
        } 
        function showErrorToUser() {
            const profileContent = document.getElementById('profile-content');
            if (profileContent) {
                profileContent.innerHTML = `
                    <div class="error-message">
                        <p>⚠️ Произошла ошибка при загрузке приложения</p>
                        <p>Пожалуйста, попробуйте перезагрузить страницу</p>
                    </div>
                `;
            }
            showErrorButton();
        }
        document.querySelectorAll('.feature-disabled, .education-feature').forEach(el => {
            el.addEventListener('click', function(e) {
                if (e.target.closest('.disabled-overlay') || this.classList.contains('feature-disabled')) {
                    shakePage();
                    showCustomAlert('Данная функция недоступна', 'error');
                    e.stopPropagation();
                }
            });
        });
        document.getElementById('auth-submit-btn').addEventListener('click', verifyActivationKey);
        document.addEventListener('DOMContentLoaded', initializeApp);
