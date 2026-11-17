#!/usr/bin/env python3
"""Rectangle-based room authoring helper.

Rooms are stored as ASCII maps in src/data/*.js (legend in NOTES.md). Typing 100-column rows by
hand is error-prone, so this builds a map from rectangle fills and prints rows ready to paste.
Edit the spec at the bottom, or import `Room` from another script.

    python3 tools/roomgen.py            # prints the milestone-1 room
"""


class Room:
    def __init__(self, w, h):
        self.w, self.h = w, h
        self.g = [['.'] * w for _ in range(h)]

    def fill(self, x0, y0, x1, y1, ch='#'):
        """Inclusive rectangle fill."""
        for y in range(y0, y1 + 1):
            for x in range(x0, x1 + 1):
                self.g[y][x] = ch
        return self

    def put(self, x, y, ch):
        assert self.g[y][x] == '.', f"cell {x},{y} already holds {self.g[y][x]!r}"
        self.g[y][x] = ch
        return self

    def rows(self):
        return [''.join(r) for r in self.g]

    def js(self):
        return '\n'.join(f"      '{r}'," for r in self.rows())


def elah_outskirts():
    r = Room(100, 30)
    r.fill(0, 24, 99, 29)                 # base ground, standing row 23
    r.fill(0, 0, 1, 29).fill(98, 0, 99, 29)
    r.fill(12, 21, 15, 21, '=')           # practice platform
    r.fill(21, 22, 34, 23)                # rise A, standing row 21
    r.fill(35, 23, 37, 23, '^')           # stake pit
    r.fill(38, 22, 56, 23)                # plateau B, standing row 21
    r.fill(42, 19, 46, 19, '=')
    r.fill(48, 16, 52, 16, '=')
    r.fill(54, 13, 66, 14)                # upper ledge, standing row 12
    r.fill(69, 22, 70, 23)                # step
    r.fill(71, 20, 80, 23)                # terrace C, standing row 19
    r.fill(84, 20, 88, 20, '=')
    r.put(5, 23, 'P')
    for x, y in [(10, 23), (45, 21), (61, 23), (57, 12), (78, 19), (95, 23)]:
        r.put(x, y, 't')
    for x, y in [(29, 21), (62, 12), (65, 23), (75, 19), (86, 23), (93, 23)]:
        r.put(x, y, 'M')
    for x, y in [(51, 21), (90, 23)]:
        r.put(x, y, 's')
    return r


if __name__ == '__main__':
    print(elah_outskirts().js())
