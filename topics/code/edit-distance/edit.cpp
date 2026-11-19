// CSS 343 - topic program: edit (Levenshtein) distance, the table exactly as
// on the slides (and in the Edit Distance chapter and Homework 9), the edit
// script read back, and the numbers the slides quote, checked against a
// breadth-first search over single edits on short strings.
//
//   build:  g++ -std=c++17 -Wall -Wextra -O2 edit.cpp -o edit
//   run:    ./edit
#include <algorithm>
#include <cstdlib>
#include <iostream>
#include <map>
#include <queue>
#include <string>
#include <vector>
using namespace std;

// Edit (Levenshtein) distance. D[i][j] = fewest edits turning the first i
// characters of a into the first j characters of b. Theta(mn) time and space.
int editDistance(const string& a, const string& b, vector<vector<int>>& D) {
    int m = a.size(), n = b.size();
    D.assign(m + 1, vector<int>(n + 1, 0));
    for (int i = 0; i <= m; i++) D[i][0] = i;         // base: delete all of a
    for (int j = 0; j <= n; j++) D[0][j] = j;         // base: insert all of b
    for (int i = 1; i <= m; i++)
        for (int j = 1; j <= n; j++)
            if (a[i-1] == b[j-1])
                D[i][j] = D[i-1][j-1];                // match: free diagonal
            else
                D[i][j] = 1 + min({D[i-1][j],         // delete a[i-1]
                                   D[i][j-1],         // insert b[j-1]
                                   D[i-1][j-1]});     // replace a[i-1]->b[j-1]
    return D[m][n];
}

// The script read back from the bottom-right corner (as in the chapter).
vector<string> editScript(const string& a, const string& b, const vector<vector<int>>& D) {
    vector<string> ops;
    int i = a.size(), j = b.size();
    while (i > 0 || j > 0) {
        if (i > 0 && j > 0 && a[i-1] == b[j-1] && D[i][j] == D[i-1][j-1]) { ops.push_back(string("match ") + a[i-1]); i--; j--; }
        else if (i > 0 && j > 0 && D[i][j] == D[i-1][j-1] + 1) { ops.push_back(string("replace ") + a[i-1] + "->" + b[j-1]); i--; j--; }
        else if (i > 0 && D[i][j] == D[i-1][j] + 1) { ops.push_back(string("delete ") + a[i-1]); i--; }
        else { ops.push_back(string("insert ") + b[j-1]); j--; }
    }
    reverse(ops.begin(), ops.end());
    return ops;
}

int lcs(const string& a, const string& b) {
    vector<vector<int>> L(a.size() + 1, vector<int>(b.size() + 1, 0));
    for (size_t i = 1; i <= a.size(); i++)
        for (size_t j = 1; j <= b.size(); j++)
            L[i][j] = a[i-1] == b[j-1] ? L[i-1][j-1] + 1 : max(L[i-1][j], L[i][j-1]);
    return L[a.size()][b.size()];
}

int bfs(const string& a, const string& b, const string& alphabet) {      // fewest single edits
    map<string, int> dist; queue<string> q; dist[a] = 0; q.push(a);
    while (!q.empty()) {
        string s = q.front(); q.pop();
        if (s == b) return dist[s];
        vector<string> next;
        for (size_t i = 0; i <= s.size(); i++)
            for (char c : alphabet) next.push_back(s.substr(0, i) + c + s.substr(i));
        for (size_t i = 0; i < s.size(); i++) {
            next.push_back(s.substr(0, i) + s.substr(i + 1));
            for (char c : alphabet) next.push_back(s.substr(0, i) + c + s.substr(i + 1));
        }
        for (const string& t : next)
            if (t.size() <= max(a.size(), b.size()) + 1 && !dist.count(t)) { dist[t] = dist[s] + 1; q.push(t); }
    }
    return -1;
}

void report(const string& a, const string& b, bool table) {
    vector<vector<int>> D;
    int d = editDistance(a, b, D);
    cout << a << " -> " << b << ": " << d << " (LCS " << lcs(a, b) << ", m + n - 2 LCS = "
         << a.size() + b.size() - 2 * lcs(a, b) << "); script:";
    for (const string& op : editScript(a, b, D)) cout << " [" << op << "]";
    cout << "\n";
    if (table)
        for (size_t i = 0; i <= a.size(); i++) {
            cout << "   " << (i ? a[i - 1] : '-') << ":";
            for (int x : D[i]) cout << " " << x;
            cout << "\n";
        }
}

int main() {
    report("kitten", "sitting", true);
    report("ab", "ba", false);
    report("MONDAY", "SUNDAY", false);
    report("abcde", "ace", false);
    srand(343);
    int bad = 0;
    for (int t = 0; t < 300; t++) {
        string a, b;
        for (int i = rand() % 5; i > 0; i--) a += char('a' + rand() % 3);
        for (int i = rand() % 5; i > 0; i--) b += char('a' + rand() % 3);
        vector<vector<int>> D;
        if (editDistance(a, b, D) != bfs(a, b, "abc")) bad++;
        for (size_t i = 1; i <= a.size(); i++)
            for (size_t j = 1; j <= b.size(); j++)
                if (abs(D[i][j] - D[i-1][j]) > 1 || abs(D[i][j] - D[i][j-1]) > 1) bad++;
    }
    cout << "300 random pairs against breadth-first search over edits, neighbours within 1: " << bad << " failures\n";
    return 0;
}
