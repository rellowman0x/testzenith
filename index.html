<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Zenith Project</title>
    <script src="https://telegram.org/js/telegram-web-app.js"></script>
    <style>
        body, html {
            margin: 0;
            padding: 0;
            height: 100%;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            display: flex;
            justify-content: center;
            align-items: center;
            background-color: #1a1a1a;
            color: #ffffff;
        }
        .container {
            text-align: center;
            max-width: 90%;
        }
        .message {
            font-size: 1.2rem;
            line-height: 1.6;
            margin-bottom: 20px;
        }
        @media (min-width: 768px) {
            .message {
                font-size: 1.5rem;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="message" id="mainMessage">Проверка данных...</div>
    </div>
    <script>
        const tg = window.Telegram?.WebApp;
        function getDeviceType() {
            const ua = navigator.userAgent;
            if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) {
                return 'tablet';
            }
            if (/Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(ua)) {
                return 'mobile';
            }
            return 'desktop';
        }
        function hasAuthData() {
            const urlParams = new URLSearchParams(window.location.search);
            const userId = urlParams.get('user_id');
            const password = urlParams.get('password');
            if (userId && password) {
                return { method: 'url', data: { user_id: userId, password: password } };
            }
            if (tg?.initDataUnsafe?.user) {
                return { method: 'telegram', data: tg.initDataUnsafe.user };
            }

            return null;
        }
        function redirectToMain(authData) {
            if (authData.method === 'telegram') {
                sessionStorage.setItem('zenith_tg_user', JSON.stringify(authData.data));
                window.location.href = './mini.html';
            } else if (authData.method === 'url') {
                const { user_id, password } = authData.data;
                window.location.href = `./mini.html?user_id=${encodeURIComponent(user_id)}&password=${encodeURIComponent(password)}`;
            }
        }
        document.addEventListener('DOMContentLoaded', () => {
            const authData = hasAuthData();
            const deviceType = getDeviceType();
            const msgEl = document.getElementById('mainMessage');
            if (authData) {
                msgEl.textContent = 'Авторизация...';
                redirectToMain(authData);
                return;
            }
            if (deviceType === 'desktop') {
                msgEl.textContent = 'Версия для ПК скоро';
            } else {
                msgEl.textContent = 'Данный способ входа невозможен. Используйте Telegram или официальное приложение.';
            }
        });
    </script>
</body>
</html>
