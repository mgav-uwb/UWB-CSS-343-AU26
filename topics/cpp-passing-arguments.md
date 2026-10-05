<!--
TOPIC · Passing arguments in C++.
  Teaches: by value, by reference, by pointer, by const reference; what each
           lets the function do to the caller's variable; the cost of a copy.
  Needs:   nothing.
  Demos:   none.
  Program: topics/code/cpp-passing-arguments/passing.cpp
  Budget:  ~7 min, 4 slides.
-->

### Passing arguments

<small>(~7 min)</small>

--

## Predict the output

```cpp
void byValue(int x)  { x = 99; }
void byRef(int& x)   { x = 99; }
void byPtr(int* x)   { *x = 99; }

int main() {
    int a = 1, b = 1, c = 1;
    byValue(a);
    byRef(b);
    byPtr(&c);
    cout << a << " " << b << " " << c << "\n";
}
```

<details class="answer"><summary>Answer:</summary>

Output: `1 99 99`. `byValue` changed its own copy.

</details>

<small>Code: <a href="../../topics/code/cpp-passing-arguments/passing.cpp">passing.cpp</a> (also in the <a href="../../code/index.html">code library</a>)</small>

--

## Three ways to pass

| Parameter | The function receives | Can change the caller's variable? |
| --- | --- | --- |
| `int x` | a copy | no |
| `int& x` | the variable itself | yes |
| `int* x` | the variable's address | yes, through `*x` |
| <code style="white-space:nowrap">const int&amp; x</code> | the variable itself, read-only | no |

A pointer can be `nullptr`. A reference always refers to something.

--

## Pass by const reference

```cpp [1,6]
long sumByValue(vector<Tracked> a) {            // copies all N elements
    long s = 0;
    for (const Tracked& t : a) s += t.v;
    return s;
}
long sumByConstRef(const vector<Tracked>& a) {  // copies nothing
    long s = 0;
    for (const Tracked& t : a) s += t.v;
    return s;
}
```

Measured on a vector of 1000:

- by value: **1000** element copies per call
- by const reference: **0**

