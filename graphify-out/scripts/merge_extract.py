import json
from pathlib import Path
ast = json.loads(Path('graphify-out/.graphify_ast.json').read_text(encoding='utf-8'))
sem = json.loads(Path('graphify-out/.graphify_semantic.json').read_text(encoding='utf-8'))
seen = {n['id'] for n in ast['nodes']}
merged_nodes = list(ast['nodes'])
for n in sem.get('nodes', []):
    if n['id'] not in seen:
        merged_nodes.append(n)
        seen.add(n)
merged_edges = ast.get('edges', []) + sem.get('edges', [])
merged_hyperedges = sem.get('hyperedges', [])
merged = {
    'nodes': merged_nodes,
    'edges': merged_edges,
    'hyperedges': merged_hyperedges,
    'input_tokens': sem.get('input_tokens', 0),
    'output_tokens': sem.get('output_tokens', 0),
}
Path('graphify-out/.graphify_extract.json').write_text(json.dumps(merged, indent=2, ensure_ascii=False), encoding='utf-8')
print(json.dumps({'nodes': len(merged_nodes), 'edges': len(merged_edges), 'ast_nodes': len(ast['nodes']), 'sem_nodes': len(sem.get('nodes', []))}, ensure_ascii=False))
