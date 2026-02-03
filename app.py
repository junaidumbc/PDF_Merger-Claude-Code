import io
from flask import Flask, render_template, request, send_file, jsonify
from PyPDF2 import PdfMerger

app = Flask(__name__)
app.secret_key = 'dev-secret-key-change-in-production'
app.config['MAX_CONTENT_LENGTH'] = 100 * 1024 * 1024  # 100 MB limit


@app.route('/')
def index():
    return render_template('index.html')


@app.route('/merge')
def merge():
    return render_template('merge.html')


@app.route('/about')
def about():
    return render_template('about.html')


@app.route('/api/merge', methods=['POST'])
def api_merge():
    uploaded_files = request.files.getlist('pdfs')

    if len(uploaded_files) < 2:
        return jsonify({'error': 'At least 2 PDF files are required.'}), 400

    merger = PdfMerger()

    try:
        for f in uploaded_files:
            if not f.filename.lower().endswith('.pdf'):
                return jsonify({'error': f'File "{f.filename}" is not a PDF.'}), 400
            merger.append(f.stream)

        output = io.BytesIO()
        merger.write(output)
        merger.close()
        output.seek(0)

        return send_file(
            output,
            mimetype='application/pdf',
            as_attachment=True,
            download_name='merged.pdf',
        )
    except Exception as e:
        merger.close()
        return jsonify({'error': f'Failed to merge PDFs: {str(e)}'}), 500


if __name__ == '__main__':
    app.run(debug=True, port=5000)
