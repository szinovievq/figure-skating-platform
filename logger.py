import logging
from logging.handlers import RotatingFileHandler
import os

LOG_FORMAT = '[INFO] %(asctime)s.%(msecs)03d - %(message)s'
DATE_FORMAT = '%Y-%m-%d %H:%M:%S'

def setup_logger():
    logger = logging.getLogger('FSLogger')
    logger.setLevel(logging.INFO)

    if not logger.handlers:
        log_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'logs')
        if not os.path.exists(log_dir):
            os.makedirs(log_dir)

        log_file = os.path.join(log_dir, 'latest.log')

        file_handler = RotatingFileHandler(log_file, maxBytes=5*1024*1024, backupCount=3, encoding='utf-8')
        file_handler.setLevel(logging.INFO)

        formatter = logging.Formatter(LOG_FORMAT, datefmt=DATE_FORMAT)
        file_handler.setFormatter(formatter)

        console_handler = logging.StreamHandler()
        console_handler.setLevel(logging.INFO)
        console_handler.setFormatter(formatter)

        logger.addHandler(file_handler)
        logger.addHandler(console_handler)

    return logger

logger = setup_logger()