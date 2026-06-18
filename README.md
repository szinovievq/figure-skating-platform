<h1 align="center">⛸️ SkateCalc - Калькулятор программ в фигурном катании</h1>


<p align="center">
  <img src="https://img.shields.io/badge/python-3670A0?style=for-the-badge&logo=python&logoColor=ffdd54" alt="Python">
  <img src="https://img.shields.io/badge/flask-%23000.svg?style=for-the-badge&logo=flask&logoColor=white" alt="Flask">
  <img src="https://img.shields.io/badge/postgresql-4169E1?style=for-the-badge&logo=postgresql&logoColor=white" alt="PostgreSQL">
  <img src="https://img.shields.io/badge/bootstrap-%23563D7C.svg?style=for-the-badge&logo=bootstrap&logoColor=white" alt="Bootstrap">
  <img src="https://img.shields.io/badge/chart.js-F5788D.svg?style=for-the-badge&logo=chart.js&logoColor=white" alt="Chart.js">
  <img src="https://img.shields.io/badge/jinja-white.svg?style=for-the-badge&logo=jinja&logoColor=black" alt="Jinja">
  <img src="https://img.shields.io/badge/javascript-%23323330.svg?style=for-the-badge&logo=javascript&logoColor=%23F7DF1E" alt="JavaScript">
</p>

**SkateCalc** — это веб-приложение для тренеров и спортсменов, позволяющее моделировать соревновательные программы, автоматически рассчитывать стоимость элементов с учётом GOE, 
модификаторов и правил ISU. Платформа поддерживает одиночное и парное катание, предоставляет статистику и аналитику прогресса, а также упрощает взаимодействие тренеров и спортсменов.

---

## 🌐 Ссылка на веб-приложение

🔗 **Доступно по адресу:** [http://193.23.209.187:5050/](http://193.23.209.187:5050/)

---

## 🚀 Основной функционал

- **Ролевая модель** – разделение на тренеров и спортсменов с разными правами доступа.
- **Калькулятор программы** – выбор элементов из структурированного каталога, добавление каскадов, установка GOE и модификаторов (недокрут, ребро, падение, не засчитан, бонус за вторую половину). Автоматический пересчёт стоимости.
- **Поддержка парного катания** – возможность составлять программы с выбором партнёра, программа дублируется для обоих спортсменов.
- **Сохранение программ** – тренер может сохранить программу в профиль спортсмена с указанием даты, вида (одиночное/парное) и типа (короткая/произвольная).
- **Статистика и аналитика** – графики изменения баллов, средние значения, детальная статистика по каждому элементу, определение самого нестабильного элемента.
- **Экспорт данных** – выгрузка программ и статистики в CSV-формат.
- **Система приглашений** – тренер находит спортсмена по ФИО, отправляет приглашение; спортсмен принимает или отклоняет его.
- **Логирование** – все ключевые действия (вход, регистрация, сохранение программы, приглашения) записываются в файл `logs/latest.log` с единым форматом времени.
- **Адаптивный интерфейс** – корректно отображается на ПК, планшетах и смартфонах.

---

## 📂 Структура проекта
```
fs-platform/
├── app.py # Точка входа, создание Flask-приложения
├── config.py # Конфигурация (секретный ключ, БД)
├── models.py # Модели данных (User, Program, Element, ProgramElement, Invitation)
├── auth.py # Маршруты аутентификации (регистрация, вход, выход)
├── main.py # Основные маршруты (главная страница, профиль, API приглашений)
├── calculator.py # Калькулятор и просмотр программ
├── statistics.py # API статистики
├── seed.py # Наполнение БД справочной информацией (элементы ISU)
├── logger.py # Настройка логирования
├── requirements.txt # Зависимости Python
├── static/
│ ├── css/
│ └── js/ # Клиентские скрипты (калькулятор, статистика, профили)
└── templates/ # HTML-шаблоны
  ├── base.html
  ├── home.html
  ├── login.html
  ├── register.html
  ├── calculator.html
  ├── program_view.html
  ├── coach_profile.html
  ├── athlete_profile.html
  └── statistics.html
```

---

## 🧑‍💻 Установка и запуск для разработки

### Требования
- Python 3.10+
- PostgreSQL (или SQLite для тестирования)

### Шаги

```bash
# 1. Клонировать репозиторий
git clone https://github.com/szinovievq/figure-skating-platform.git
cd fs-platform

# 2. Создать виртуальное окружение и активировать его
python3 -m venv venv
source venv/bin/activate   # Linux/Mac
# venv\Scripts\activate   # Windows

# 3. Установить зависимости
pip install -r requirements.txt

# 4. Настроить базу данных (PostgreSQL)
# Создать БД и пользователя с параметрами из config.py
# Либо использовать SQLite, изменив URI в config.py

# 5. Создать таблицы
python -c "from app import create_app; from models import db; app = create_app(); with app.app_context(): db.create_all()"

# 6. Наполнить справочник элементов
python seed.py   # (вызовется автоматически при первом запуске)

# 7. Запустить приложение
python app.py
# или
flask run --host=0.0.0.0 --port=5050
