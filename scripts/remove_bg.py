"""
Скрипт удаления заднего фона с изображения Security_Guard.png.
Использует rembg. Результат сохраняется в тот же файл и открывается в просмотрщике.

Запуск (из корня проекта):
  pip install -r scripts/requirements.txt
  python scripts/remove_bg.py
"""
from pathlib import Path
import sys
import os
import io

# Корень проекта — на уровень выше scripts/
SCRIPT_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = SCRIPT_DIR.parent
INPUT_PATH = PROJECT_ROOT / "frontend" / "images" / "Security_Guard.png"
OUTPUT_PATH = INPUT_PATH  # перезапись


def main():
    if not INPUT_PATH.exists():
        print(f"Ошибка: файл не найден: {INPUT_PATH}")
        sys.exit(1)

    try:
        from rembg import remove
        from PIL import Image
    except ImportError:
        print("Установите зависимости: pip install -r scripts/requirements.txt")
        sys.exit(1)

    print("Загрузка изображения...")
    with open(INPUT_PATH, "rb") as f:
        input_data = f.read()

    print("Удаление фона (rembg)...")
    output_data = remove(input_data)

    print("Сохранение...")
    output_img = Image.open(io.BytesIO(output_data))
    output_img.save(OUTPUT_PATH)

    print(f"Готово: {OUTPUT_PATH}")

    # Открыть в просмотрщике ОС
    abs_path = str(OUTPUT_PATH.resolve())
    if sys.platform == "win32":
        os.startfile(abs_path)
    elif sys.platform == "darwin":
        os.system(f'open "{abs_path}"')
    else:
        os.system(f'xdg-open "{abs_path}"')


if __name__ == "__main__":
    main()
