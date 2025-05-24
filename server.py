from http.server import HTTPServer, BaseHTTPRequestHandler
import json
import sqlite3
from urllib.parse import parse_qs, urlparse
import os

# Создаем базу данных, если она не существует
def init_db():
    conn = sqlite3.connect('users.db')
    c = conn.cursor()
    c.execute('''CREATE TABLE IF NOT EXISTS users
                 (id INTEGER PRIMARY KEY AUTOINCREMENT,
                  email TEXT UNIQUE,
                  password TEXT,
                  name TEXT)''')
    conn.commit()
    conn.close()

class RequestHandler(BaseHTTPRequestHandler):
    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()

    def do_GET(self):
        # Обработка статических файлов
        if self.path == '/':
            self.path = '/index.html'
        try:
            print(f"Received request for path: {self.path}")  # Логируем входящий путь
            # Убираем query string
            filepath = self.path.split('?', 1)[0][1:]
            print(f"Looking for file: {filepath}")  # Логируем путь к файлу
            
            # Проверяем существование файла
            if not os.path.exists(filepath):
                print(f"File not found: {filepath}")
                self.send_error(404, f"File not found: {filepath}")
                return
                
            # Получаем расширение файла
            file_extension = os.path.splitext(filepath)[1]
            print(f"File extension: {file_extension}")  # Логируем расширение
            
            # Определяем тип контента
            content_types = {
                '.html': 'text/html',
                '.css': 'text/css',
                '.js': 'application/javascript',
                '.jpg': 'image/jpeg',
                '.jpeg': 'image/jpeg',
                '.png': 'image/png',
                '.gif': 'image/gif',
                '.ico': 'image/x-icon',
                '.json': 'application/json'  # Добавляем поддержку JSON
            }
            content_type = content_types.get(file_extension, 'application/octet-stream')
            
            with open(filepath, 'rb') as file:
                self.send_response(200)
                self.send_header('Content-type', content_type)
                self.send_header('Access-Control-Allow-Origin', '*')  # Добавляем CORS заголовок
                self.end_headers()
                self.wfile.write(file.read())
                print(f"Successfully served file: {filepath}")  # Логируем успешную отправку
                
        except FileNotFoundError as e:
            print(f"FileNotFoundError: {str(e)}")
            self.send_error(404, f"File not found: {str(e)}")
        except Exception as e:
            print(f"Error processing request: {str(e)}")
            self.send_error(500, str(e))

    def do_POST(self):
        # Получаем длину тела запроса
        content_length = int(self.headers['Content-Length'])
        # Читаем тело запроса
        post_data = self.rfile.read(content_length)
        print(f"Received POST data on {self.path}: {post_data.decode('utf-8')}") # Логируем полученные данные

        # Обрабатываем разные эндпоинты
        if self.path == '/register':
            # Парсим данные как JSON для /register
            data = json.loads(post_data.decode('utf-8'))
            self.handle_register(data)
        elif self.path == '/login':
             # Парсим данные как JSON для /login
            data = json.loads(post_data.decode('utf-8'))
            self.handle_login(data)
        elif self.path == '/payment-callback.html':
            # Это Fondy callback. Принимаем данные и отправляем успешный ответ.
            # В реальной интеграции здесь была бы проверка подписи и обновление статуса заказа.
            print("Received Fondy payment callback.")
            # Fondy ожидает ответ 200 OK
            self.send_response(200)
            self.send_header('Content-type', 'text/plain')
            self.end_headers()
            self.wfile.write(b'OK') # Отправляем подтверждение
        else:
            self.send_error(404, "Not Found")

    def handle_register(self, data):
        try:
            conn = sqlite3.connect('users.db')
            c = conn.cursor()
            
            # Проверяем, существует ли пользователь
            c.execute('SELECT * FROM users WHERE email = ?', (data['email'],))
            if c.fetchone():
                self.send_response(400)
                self.send_header('Content-type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                self.wfile.write(json.dumps({
                    'error': 'Користувач з такою електронною поштою вже існує'
                }).encode())
                return

            # Добавляем нового пользователя
            c.execute('INSERT INTO users (email, password, name) VALUES (?, ?, ?)',
                     (data['email'], data['password'], data['name']))
            conn.commit()

            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(json.dumps({
                'message': 'Реєстрація успішна',
                'user': {
                    'email': data['email'],
                    'name': data['name']
                }
            }).encode())

        except Exception as e:
            self.send_response(500)
            self.send_header('Content-type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(json.dumps({
                'error': str(e)
            }).encode())
        finally:
            conn.close()

    def handle_login(self, data):
        try:
            conn = sqlite3.connect('users.db')
            c = conn.cursor()
            
            # Проверяем учетные данные
            c.execute('SELECT * FROM users WHERE email = ? AND password = ?',
                     (data['email'], data['password']))
            user = c.fetchone()

            if user:
                self.send_response(200)
                self.send_header('Content-type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                self.wfile.write(json.dumps({
                    'message': 'Вхід успішний',
                    'user': {
                        'id': user[0],
                        'email': user[1],
                        'name': user[3]
                    }
                }).encode())
            else:
                self.send_response(401)
                self.send_header('Content-type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                self.wfile.write(json.dumps({
                    'error': 'Невірний email або пароль'
                }).encode())

        except Exception as e:
            self.send_response(500)
            self.send_header('Content-type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(json.dumps({
                'error': str(e)
            }).encode())
        finally:
            conn.close()

def run_server():
    # Инициализируем базу данных
    init_db()
    
    # Запускаем сервер
    server_address = ('', 8000)
    httpd = HTTPServer(server_address, RequestHandler)
    print('Сервер запущено на порту 8000...')
    httpd.serve_forever()

if __name__ == '__main__':
    run_server() 