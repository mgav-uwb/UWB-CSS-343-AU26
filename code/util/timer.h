// CSS 343 · code library: timer.h
// Wall-clock timing for experiments, on std::chrono::steady_clock (which never
// jumps when the system clock is adjusted).
//
//   #include "timer.h"
//   Stopwatch sw;  ...work...;  double s = sw.seconds();
//   double best = fastestOf(5, [&] { result = algorithm(data); });
//
// Rules the chapter "Computer Systems Primer" explains: compile with -O2, use
// every result (or the optimizer may delete the work), and time runs long
// enough (tens of milliseconds or more) that the timer and the first touch of
// fresh memory do not dominate.
#pragma once
#include <chrono>
#include <algorithm>

class Stopwatch {
public:
    Stopwatch() { restart(); }
    void restart() { t0 = std::chrono::steady_clock::now(); }
    double seconds() const {
        return std::chrono::duration<double>(std::chrono::steady_clock::now() - t0).count();
    }
private:
    std::chrono::steady_clock::time_point t0;
};

/** run f `reps` times and return the fastest time in seconds: the run least
 *  disturbed by other programs */
template <class F> double fastestOf(int reps, F f) {
    double best = 1e300;
    for (int i = 0; i < reps; i++) { Stopwatch sw; f(); best = std::min(best, sw.seconds()); }
    return best;
}
