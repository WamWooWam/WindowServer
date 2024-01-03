// Copyright (c) 2020 MattKC
// Copyright (c) 2023 WamWooWam
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in all
// copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
// SOFTWARE.

import { AdjustWindowRect, BeginPaint, CreateWindowEx, DefWindowProc, DispatchMessage, EndPaint, GetMessage, HWND, IDC, IDI, InvalidateRect, LPARAM, LoadCursor, LoadIcon, MAKEINTRESOURCE, MSG, PAINTSTRUCT, PostMessage, PostQuitMessage, RegisterClass, TranslateMessage, VK, WM, WPARAM, WS } from "@window-server/user32";
import { CreateSolidBrush, GetStockObject, NULL_PEN, RECT, Rectangle, SelectObject } from "@window-server/gdi32";

import { GetModuleHandle } from "@window-server/kernel32";

const WINDOW_STYLE = WS.VISIBLE | WS.OVERLAPPEDWINDOW & ~WS.THICKFRAME & ~WS.MAXIMIZEBOX;
const WINDOW_WIDTH = 640;
const WINDOW_HEIGHT = 480;
const TILE_SIZE = 40;
const HORIZONTAL_TILES = WINDOW_WIDTH / TILE_SIZE;
const VERTICAL_TILES = WINDOW_HEIGHT / TILE_SIZE;
const MAX_TILE_COUNT = HORIZONTAL_TILES * VERTICAL_TILES;
const START_X = HORIZONTAL_TILES / 2;
const START_Y = VERTICAL_TILES / 2;
const SNAKE_PADDING = TILE_SIZE / 4;
const SNAKE_SIZE = TILE_SIZE - (SNAKE_PADDING * 2);
const FOOD_PADDING = TILE_SIZE / 8;
const FOOD_SIZE = TILE_SIZE - (FOOD_PADDING * 2);
const MAX_DIR_QUEUE = 8;

type Postion = {
    x: number;
    y: number;
}

const window_name = "Snake";
const window_rect: RECT = { top: 0, left: 0, right: WINDOW_WIDTH, bottom: WINDOW_HEIGHT };
const snake_pos: Postion[] = [];
const food_pos = { x: 0, y: 0 }
let snake_len = 1;
let player_dir = 1;
let dir_queue: number[] = [0, 0, 0, 0, 0, 0, 0, 0];
let dir_queue_sz = 0;
let dir_queue_read = 0;
let forgiveness = false;

function PosEqual(a: Postion, b: Postion) {
    return a.x === b.x && a.y === b.y;
}

function PosExists(pos: Postion) {
    for (let i = 0; i < snake_len; i++) {
        if (PosEqual(snake_pos[i], pos)) {
            return true;
        }
    }

    return false;
}

function SetFood() {
    do {
        food_pos.x = Math.floor(Math.random() * HORIZONTAL_TILES);
        food_pos.y = Math.floor(Math.random() * VERTICAL_TILES);
    } while (PosExists(food_pos));
}

async function WindowProc(hwnd: HWND, uMsg: number, wParam: WPARAM, lParam: LPARAM) {
    switch (uMsg) {
        case WM.PAINT: {
            let ctx = {} as PAINTSTRUCT;
            let device = await BeginPaint(hwnd, ctx);

            await SelectObject(device, await GetStockObject(NULL_PEN));

            let food_pos_px: Postion = {
                x: food_pos.x * TILE_SIZE + FOOD_PADDING,
                y: food_pos.y * TILE_SIZE + FOOD_PADDING
            };

            await Rectangle(
                device,
                food_pos_px.x,
                food_pos_px.y,
                food_pos_px.x + FOOD_SIZE,
                food_pos_px.y + FOOD_SIZE);

            if (player_dir === -1) {
                SelectObject(device, await CreateSolidBrush(0x0000FF));
            } else if (player_dir === -2) {
                SelectObject(device, await CreateSolidBrush(0x00FF00));
            }

            let top_left: Postion = { x: 0, y: 0 };
            let bottom_right: Postion = { x: 0, y: 0 };
            let draw_rect: RECT = { top: 0, left: 0, right: 0, bottom: 0 };

            for (let i = 0; i < snake_len; i++) {
                top_left = { ...snake_pos[i] };
                bottom_right = { ...snake_pos[i] };

                if (i > 0) {
                    top_left.x = Math.min(top_left.x, snake_pos[i - 1].x);
                    top_left.y = Math.min(top_left.y, snake_pos[i - 1].y);
                    bottom_right.x = Math.max(bottom_right.x, snake_pos[i - 1].x);
                    bottom_right.y = Math.max(bottom_right.y, snake_pos[i - 1].y);
                }

                draw_rect.left = top_left.x * TILE_SIZE + SNAKE_PADDING;
                draw_rect.top = top_left.y * TILE_SIZE + SNAKE_PADDING;
                draw_rect.right = (1 + bottom_right.x) * TILE_SIZE - SNAKE_PADDING;
                draw_rect.bottom = (1 + bottom_right.y) * TILE_SIZE - SNAKE_PADDING;

                if (top_left.x == 0 && bottom_right.x == HORIZONTAL_TILES - 1) {
                    // Exception for wrapping around the X axis
                    await Rectangle(
                        device,
                        0,
                        draw_rect.top,
                        TILE_SIZE - SNAKE_PADDING,
                        draw_rect.bottom);

                    draw_rect.left = WINDOW_WIDTH - TILE_SIZE + SNAKE_PADDING;
                    draw_rect.right = WINDOW_WIDTH;
                } else if (top_left.y == 0 && bottom_right.y == VERTICAL_TILES - 1) {
                    // Exception for wrapping around the Y axis
                    await Rectangle(
                        device,
                        draw_rect.left,
                        0,
                        draw_rect.right,
                        TILE_SIZE - SNAKE_PADDING);

                    draw_rect.top = WINDOW_HEIGHT - TILE_SIZE + SNAKE_PADDING;
                    draw_rect.bottom = WINDOW_HEIGHT;
                }

                // Draw a long rectangle from the previous position to this one
                await Rectangle(
                    device,
                    draw_rect.left,
                    draw_rect.top,
                    draw_rect.right,
                    draw_rect.bottom);
            }

            await EndPaint(hwnd, ctx);
            break;
        }
        case WM.KEYDOWN: {
            if (player_dir < 0) {
                break;
            }
            switch (wParam) {
                case VK.LEFT:
                case VK.UP:
                case VK.RIGHT:
                case VK.DOWN:
                    dir_queue[dir_queue_sz % MAX_DIR_QUEUE] = wParam;
                    dir_queue_sz++;
                    break;
                case 0x50: // Pause
                case VK.PAUSE: // Pause
                    player_dir = 0;
                    dir_queue_read = dir_queue_sz;
                    break;
            }

            break;
        }
        case WM.TIMER: {
            while (dir_queue_read < dir_queue_sz) {
                let proposed_dir = dir_queue[dir_queue_read % MAX_DIR_QUEUE];
                dir_queue_read++;

                if (player_dir != proposed_dir
                    && proposed_dir + 2 != player_dir
                    && proposed_dir - 2 != player_dir) {
                    player_dir = proposed_dir;
                    break;
                }
            }

            let new_pos = { ...snake_pos[0] };
            let moved = true;

            switch (player_dir) {
                case VK.LEFT:
                    new_pos.x--;
                    break;
                case VK.RIGHT:
                    new_pos.x++;
                    break;
                case VK.UP:
                    new_pos.y--;
                    break;
                case VK.DOWN:
                    new_pos.y++;
                    break;
                default:
                    moved = false;
            }

            if (moved) {
                if (new_pos.x < 0) {
                    new_pos.x = HORIZONTAL_TILES - 1;
                } else if (new_pos.x == HORIZONTAL_TILES) {
                    new_pos.x = 0;
                } else if (new_pos.y < 0) {
                    new_pos.y = VERTICAL_TILES - 1;
                } else if (new_pos.y == VERTICAL_TILES) {
                    new_pos.y = 0;
                }

                snake_len--;
                let collided = PosExists(new_pos);
                snake_len++;

                if (collided) { // Check for collision
                    if (forgiveness) {
                        player_dir = -1;
                        dir_queue_read = dir_queue_sz;
                        await InvalidateRect(hwnd, null, true);
                    } else {
                        forgiveness = true;
                    }
                } else {
                    let ate_food = PosEqual(new_pos, food_pos);

                    if (ate_food) {
                        // Ate food, increase snake size
                        snake_len++;
                    }

                    forgiveness = false;

                    for (let i = snake_len - 1; i > 0; i--) {
                        snake_pos[i] = snake_pos[i - 1];
                    }

                    snake_pos[0] = new_pos;

                    if (ate_food) {
                        if (snake_len == MAX_TILE_COUNT) {
                            food_pos.x = -1;
                            player_dir = -2;
                            dir_queue_read = dir_queue_sz;
                        } else {
                            SetFood();
                        }
                    }

                    await InvalidateRect(hwnd, null, true);
                }
            }
            break;
        }
        case WM.CLOSE: {
            await PostQuitMessage(0);
            break;
        }
    }

    return await DefWindowProc(hwnd, uMsg, wParam, lParam);
}

export default async function main() {
    let instance = await GetModuleHandle(null);

    await AdjustWindowRect(window_rect, WINDOW_STYLE, false);

    let window_class = {
        cbSize: 0,
        // style: CS.OWNDC | CS.HREDRAW | CS.VREDRAW,
        style: 0,
        lpfnWndProc: WindowProc,
        cbClsExtra: 0,
        cbWndExtra: 0,
        hInstance: instance,
        hIcon: await LoadIcon(0, MAKEINTRESOURCE(IDI.APPLICATION)),
        hCursor: await LoadCursor(0, MAKEINTRESOURCE(IDC.ARROW)),
        hbrBackground: await CreateSolidBrush(0x000000),
        lpszMenuName: null,
        lpszClassName: window_name,
        hIconSm: 0
    };

    let atom = await RegisterClass(window_class);

    for (let i = 0; i < MAX_TILE_COUNT; i++) {
        snake_pos.push({ x: 0, y: 0 });
    }

    snake_pos[0] = { x: START_X, y: START_Y };

    let window = await CreateWindowEx(
        0,
        window_name,
        window_name,
        WINDOW_STYLE,
        0, 0,
        window_rect.right - window_rect.left,
        window_rect.bottom - window_rect.top,
        0, 0, instance, null);

    SetFood();
    // await SetTimer(window, null, 150, 0);
    setInterval(() => {
        PostMessage(window, WM.TIMER, 0, 0);
    }, 150);

    let msg = {} as MSG;
    while (await GetMessage(msg, 0, 0, 0)) {
        if (msg.message == WM.QUIT)
            break;

        await TranslateMessage(msg);
        await DispatchMessage(msg);
    }

    return 0;
}
