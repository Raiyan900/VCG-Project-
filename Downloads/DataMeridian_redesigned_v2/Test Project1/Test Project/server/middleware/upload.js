const multer = require('multer');
const path = require('path');
const fs = require('fs');

const storageProvider = (process.env.STORAGE_PROVIDER || 'local').toLowerCase();
const uploadDir = process.env.UPLOAD_DIR
  ? path.resolve(process.env.UPLOAD_DIR)
  : path.join(__dirname, '..', 'uploads');

if (storageProvider === 'local' && !fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const ALLOWED_EXTENSIONS = new Set([
  '.csv', '.tsv', '.json', '.txt', '.fasta', '.fastq', '.vcf', '.bam', '.sam',
  '.xlsx', '.xls', '.pdf', '.zip', '.gz', '.png', '.jpg', '.jpeg', '.tiff',
]);

const storage = storageProvider === 'cloud'
  ? multer.memoryStorage()
  : multer.diskStorage({
      destination: (req, file, cb) => cb(null, uploadDir),
      filename: (req, file, cb) => {
        const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
        const ext = path.extname(file.originalname);
        cb(null, `${unique}${ext}`);
      },
    });

function fileFilter(req, file, cb) {
  const ext = path.extname(file.originalname).toLowerCase();
  if (ALLOWED_EXTENSIONS.has(ext)) {
    cb(null, true);
  } else {
    cb(new Error(`File type ${ext} is not permitted`));
  }
}

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 500 * 1024 * 1024 }, // 500MB per file
});

module.exports = upload;
