// CSS 343 · topic program: BFS SHORTEST PATH on an n x n grid: O(n^2) memory,
// and how that memory depends on the GEOMETRY of the maze.
//   g++ -std=c++17 -O2 bfs_grid.cpp -o bfs_grid && ./bfs_grid
//
// BFS from (0,0) to (n-1,n-1). To recover the actual shortest PATH we keep a
// PREDECESSOR per cell (parent[], one int each) and walk it back from the goal.
// The slide shows the 1-byte visited FLAG (n^2, just "reachable?"); here we store
// a predecessor (4n^2) so we can report the path, the next tier up.
//
// Two memory stories, side by side:
//   * the FIXED n x n parent[] array -> 4n^2 bytes, the SAME for every maze:
//     it is allocated whether or not a cell is ever reached (input-INSENSITIVE).
//   * a DYNAMIC structure that stores only the cells BFS reaches -> Theta(R)
//     bytes, where R depends on the maze (input-SENSITIVE).
// We run two layouts at each size so the contrast is visible:
//   OPEN  : no walls                       -> R ~ n^2 (BFS reaches everything)
//   L-PATH: only row 0 + last column open  -> R ~ 2n  (a thin corridor)
// The fixed array is 4n^2 in BOTH; the cells reached R (and the peak queue)
// track the geometry. This is the Part-6 case study, measured.

#include <cstdio>
#include <vector>
#include <queue>
#include <algorithm>
using namespace std;

enum Layout { OPEN, LPATH };

// is cell (r,c) open (not a wall)?  OPEN: all cells.  LPATH: an L-shaped corridor
// (0,0) -> (0,n-1) -> (n-1,n-1): the top row and the right column.
bool isFree(int r, int c, int n, Layout layout) {
    if (layout == OPEN) return true;
    return r == 0 || c == n - 1;
}

struct Result { long long reached, pathLen, peakQueue; };

Result bfsPath(int n, Layout layout) {
    const int START = 0, GOAL = n * n - 1;        // (0,0) and (n-1,n-1), flattened
    vector<int> parent(n * n, -1);                // FIXED n^2 array: 4 bytes/cell
    queue<int> frontier;
    frontier.push(START);
    parent[START] = START;                        // visited marker (own parent)
    long long reached = 0, peakQueue = 0;
    int dr[4] = {-1, 1, 0, 0}, dc[4] = {0, 0, -1, 1};
    bool found = false;
    while (!frontier.empty() && !found) {
        peakQueue = max(peakQueue, (long long)frontier.size());
        int id = frontier.front(); frontier.pop();
        reached++;
        int r = id / n, c = id % n;
        for (int d = 0; d < 4; d++) {
            int nr = r + dr[d], nc = c + dc[d];
            if (nr < 0 || nr >= n || nc < 0 || nc >= n) continue;
            if (!isFree(nr, nc, n, layout)) continue;
            int nid = nr * n + nc;
            if (parent[nid] == -1) {              // first time we see it = shortest
                parent[nid] = id;
                if (nid == GOAL) { found = true; break; }
                frontier.push(nid);
            }
        }
    }
    // reconstruct the shortest path by walking predecessors back from the goal
    long long pathLen = 0;
    if (parent[GOAL] != -1)
        for (int id = GOAL; id != START; id = parent[id]) pathLen++;
    return { reached, pathLen, peakQueue };
}

int main() {
    printf("%-7s %6s %12s %10s %8s %14s\n",
           "layout", "n", "reached R", "path len", "peak Q", "fixed 4n^2 B");
    for (int n = 100; n <= 800; n += n) {
        for (Layout L : {OPEN, LPATH}) {
            Result r = bfsPath(n, L);
            long long fixedBytes = (long long)n * n * (long long)sizeof(int);   // parent[]
            printf("%-7s %6d %12lld %10lld %8lld %14lld\n",
                   L == OPEN ? "OPEN" : "L-PATH", n, r.reached, r.pathLen,
                   r.peakQueue, fixedBytes);
        }
    }
    printf("\nShortest path recovered from a PREDECESSOR array (4n^2 bytes, FIXED).\n"
           "The fixed array is the same for both mazes -> Theta(n^2), input-INSENSITIVE.\n"
           "Cells reached R tracks the geometry: OPEN ~ n^2, L-PATH ~ 2n -> a dynamic\n"
           "set storing only reached cells would be Theta(R), input-SENSITIVE. The peak\n"
           "queue is the wavefront: ~n on the open grid, ~1 in the one-wide corridor.\n");
}
