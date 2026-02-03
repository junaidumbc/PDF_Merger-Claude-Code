# PDF Merger

A simple, fast, and private web app to merge multiple PDF files into one. Built with Flask and Bootstrap 5.

## Features

- **Drag & Drop** -- Upload PDFs by dragging them into the browser
- **Reorder** -- Drag files to arrange them in any order before merging
- **Instant Download** -- Merged PDF is downloaded immediately
- **Dark Mode** -- Toggle between light and dark themes
- **Privacy First** -- Files are processed in memory on the server, never stored permanently

## Tech Stack

- Python / Flask
- PyPDF2
- Bootstrap 5
- Vanilla JavaScript

## Run Locally

```bash
pip install -r requirements.txt
python app.py
```

Then open http://localhost:5000

## Deploy

This app is ready to deploy on Render, Railway, or any platform that supports Python/Flask.

For production, use gunicorn:

```bash
gunicorn app:app
```

## License

MIT
