import fitz
from pathlib import Path

files = [
    Path('attached_assets/piece_of_history_replit_stepbystep_prompts_1789379219755.pdf'),
    Path('attached_assets/piece_of_history_master_spec_v2_1789379219823.pdf'),
]
out = Path('.agents/outputs/pdf_renders')
out.mkdir(parents=True, exist_ok=True)
for path in files:
    doc = fitz.open(path)
    print(f'{path.name}: pages={doc.page_count}, metadata={doc.metadata}')
    stem = path.stem
    for i, page in enumerate(doc):
        pix = page.get_pixmap(matrix=fitz.Matrix(1.5, 1.5), alpha=False)
        target = out / f'{stem}_page_{i+1:03d}.png'
        pix.save(target)
        text = page.get_text().strip().replace('\n', ' ')
        print(f'  page {i+1}: chars={len(text)} image={target}')
