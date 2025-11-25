# Graph Layout Options

## Current Implementation: Dagre Hierarchical Layout

The family tree now uses **Dagre** (Directed Acyclic Graph) layout algorithm, which provides clean, structured positioning of nodes similar to Neo4j Bloom.

### Key Benefits

1. **Hierarchical Structure**: Nodes are automatically arranged in generational levels
2. **Minimal Edge Crossings**: Algorithm optimizes to reduce visual clutter
3. **Consistent Positioning**: Stable layout that doesn't change randomly
4. **Professional Appearance**: Clean, organized tree structure

### Configuration Options

You can adjust the layout in `components/ForceGraph.tsx` by modifying the `applyDagreLayout` parameters:

```typescript
const positionedNodes = applyDagreLayout(graphData.nodes, graphData.links, {
    rankdir: "TB", // Direction: "TB" (top-bottom), "BT", "LR", "RL"
    ranksep: 200, // Vertical space between generations (default: 200)
    nodesep: 150, // Horizontal space between siblings (default: 150)
    edgesep: 50, // Space between edges (default: 50)
});
```

### Layout Directions

-   `"TB"` - Top to Bottom (default, oldest generation at top)
-   `"BT"` - Bottom to Top (oldest generation at bottom)
-   `"LR"` - Left to Right (horizontal layout)
-   `"RL"` - Right to Left (horizontal layout)

### Spacing Adjustments

-   **Increase `ranksep`** for more vertical space between generations
-   **Increase `nodesep`** for more horizontal space between siblings
-   **Decrease values** for a more compact layout

### Example Configurations

#### Compact Layout

```typescript
ranksep: 150,
nodesep: 100,
```

#### Spacious Layout (Current Default)

```typescript
ranksep: 250,
nodesep: 200,
```

#### Horizontal Layout

```typescript
rankdir: "LR",
ranksep: 300,
nodesep: 100,
```

## Force Simulation (Static Mode)

The force simulation has been configured to be **mostly static** to preserve the clean Dagre layout:

-   **Link Force**: Strength set to 0 (prevents nodes from being pulled together)
-   **Collision Force**: Active to prevent overlaps if you drag nodes
-   **Movement**: Minimal automatic movement after initial placement

This ensures the "well structured" look is maintained while still allowing you to drag nodes if needed.

## Alternative: Custom Hierarchical Layout

If you need even more control, there's a `applyCustomHierarchicalLayout` function in `utils/dagreLayout.ts` that implements a BFS-based hierarchical layout. This can be swapped in if you want to customize the generation assignment logic.

## Switching Back to Force-Only Layout

If you want to revert to the original force-directed layout, simply remove the `applyDagreLayout` call and restore the original force configuration from git history.
