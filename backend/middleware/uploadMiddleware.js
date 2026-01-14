const multer = require('multer');

// Настройка multer для хранения файлов в памяти
const storage = multer.memoryStorage();

// Фильтр файлов - только CSV и JSON
const fileFilter = (req, file, cb) => {
  if (file.mimetype === 'text/csv' || 
      file.mimetype === 'application/json' ||
      file.originalname.endsWith('.csv') ||
      file.originalname.endsWith('.json')) {
    cb(null, true);
  } else {
    cb(new Error('Поддерживаются только CSV и JSON файлы'), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB максимум
  }
});

module.exports = upload;