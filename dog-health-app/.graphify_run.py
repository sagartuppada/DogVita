#!/usr/bin/env python3
"""Graphify dog-health-app codebase."""
import json, os, sys
from pathlib import Path

PROJECT = Path(r"C:\Users\User\Desktop\Santo\DogVita\dog-health-app")
OUT = PROJECT / "graphify-out"
OUT.mkdir(exist_ok=True)

os.chdir(PROJECT)
sys.path.insert(0, str(PROJECT))

# Step 1: Detect
print("[1/5] Detecting files...")
from graphify.detect import detect
detect_result = detect(PROJECT)
(OUT / ".graphify_detect.json").write_text(json.dumps(detect_result, indent=2))
print(f"  Corpus: {detect_result['total_files']} files, ~{detect_result['total_words']} words")
for k, v in detect_result["files"].items():
    if v:
        print(f"  {k}: {len(v)} files")

# Flatten all file paths
all_paths = []
for file_list in detect_result["files"].values():
    if file_list:
        all_paths.extend([Path(f) for f in file_list])
print(f"  Total paths to extract: {len(all_paths)}")

# Step 2: Extract (AST parsing)
print("[2/5] Extracting code structure...")
from graphify.extract import extract
extraction = extract(all_paths, cache_root=OUT, parallel=False)
(OUT / "extraction.json").write_text(json.dumps(extraction, indent=2))
print(f"  Extracted {len(extraction.get('nodes', []))} nodes, {len(extraction.get('edges', []))} edges")

# Step 3: Build graph
print("[3/5] Building knowledge graph...")
from graphify.build import build
import networkx as nx
graph = build([extraction])
# Convert NetworkX graph to JSON-serializable dict
graph_data = nx.node_link_data(graph, edges="links")
(OUT / "graph.json").write_text(json.dumps(graph_data, indent=2))
print(f"  Nodes: {len(graph_data['nodes'])}, Edges: {len(graph_data['links'])}")

# Step 4: Cluster into communities
print("[4/5] Detecting communities...")
from graphify.cluster import cluster
communities = cluster(graph)
(OUT / "communities.json").write_text(json.dumps(communities, indent=2))
num_communities = communities.get("num_communities", len(communities.get("communities", [])))
print(f"  Communities: {num_communities}")

# Step 5: Generate HTML report
print("[5/5] Generating HTML report...")
from graphify.report import generate
html = generate(graph, communities)
(OUT / "graphify.html").write_text(html)
print(f"  Report: graphify.html ({len(html)} bytes)")

# Save summary
summary = {
    "nodes": len(graph_data['nodes']),
    "edges": len(graph_data['links']),
    "communities": num_communities,
    "files": detect_result["total_files"],
    "words": detect_result["total_words"]
}
(OUT / "summary.json").write_text(json.dumps(summary, indent=2))
print(f"\nDone! Graph saved to graphify-out/")
print(json.dumps(summary, indent=2))
