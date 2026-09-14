import fitz
from pathlib import Path
files = [
    Path('attached_assets/piece_of_history_replit_stepbystep_prompts_1789379219755.pdf'),
    Path('attached_assets/piece_of_history_master_spec_v2_1789379219823.pdf'),
]
out = Path('.agents/outputs')
for path in files:
    doc = fitz.open(path)
    target = out / f'{path.stem}.txt'
    with target.open('w', encoding='utf-8') as f:
        for i, page in enumerate(doc, 1):
            f.write(f'\n===== PAGE {i} =====\n')
            f.write(page.get_text())
    print(target, target.stat().st_size)
