// CSS 343 - topic program: activity selection, earliest finish first.
// Runs the rule on the slides' five requests and on the ten-request practice,
// and checks each answer against a brute-force search over every subset.
//
//   build:  g++ -std=c++17 -Wall -Wextra -O2 activities.cpp -o activities
//   run:    ./activities
#include <algorithm>
#include <climits>
#include <iostream>
#include <string>
#include <vector>
using namespace std;

struct Request { string name; int start, finish; };     // [start, finish)

bool finishesFirst(const Request& a, const Request& b) {
    return a.finish < b.finish;
}

vector<Request> selectRequests(vector<Request> reqs) {    // a copy: sorted here
    sort(reqs.begin(), reqs.end(), finishesFirst);
    vector<Request> taken;
    int roomFreeAt = INT_MIN;                // nothing taken yet
    for (const Request& r : reqs) {
        if (r.start >= roomFreeAt) {         // compatible with all taken
            taken.push_back(r);              // commit: never undone
            roomFreeAt = r.finish;
        }
    }
    return taken;
}

// Brute force: the largest set of pairwise compatible requests.
int bestByBruteForce(const vector<Request>& reqs) {
    int n = reqs.size(), best = 0;
    for (int mask = 0; mask < (1 << n); mask++) {
        bool ok = true;
        for (int i = 0; i < n && ok; i++)
            for (int j = i + 1; j < n && ok; j++)
                if ((mask >> i & 1) && (mask >> j & 1)
                    && reqs[i].start < reqs[j].finish && reqs[j].start < reqs[i].finish)
                    ok = false;
        if (ok) best = max(best, __builtin_popcount(mask));
    }
    return best;
}

void run(const string& label, const vector<Request>& reqs) {
    vector<Request> taken = selectRequests(reqs);
    cout << label << ": takes";
    for (const Request& r : taken) cout << " " << r.name;
    cout << " (" << taken.size() << "); brute force " << bestByBruteForce(reqs) << "\n";
}

int main() {
    run("five", {{"a", 1, 5}, {"b", 2, 6}, {"c", 3, 7}, {"d", 7, 9}, {"e", 8, 11}});
    run("ten", {{"a", 1, 4}, {"b", 3, 5}, {"c", 0, 6}, {"d", 4, 7}, {"e", 7, 9},
                {"f", 5, 9}, {"g", 6, 10}, {"h", 8, 11}, {"i", 8, 12}, {"j", 11, 13}});
    run("shortest-first breaker", {{"A", 0, 6}, {"B", 5, 7}, {"C", 6, 12}});
    run("earliest-start breaker", {{"P", 0, 10}, {"Q", 1, 2}, {"R", 3, 4}, {"S", 5, 6}});
    return 0;
}
