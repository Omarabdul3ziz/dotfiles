-- Keymaps are automatically loaded on the VeryLazy event
-- Default keymaps that are always set: https://github.com/LazyVim/LazyVim/blob/main/lua/lazyvim/config/keymaps.lua
-- Add any additional keymaps here

-- Move the selected block up/down and re-indent it.
vim.keymap.set("v", "J", ":m '>+1<CR>gv=gv", { desc = "Move selected text down" })
vim.keymap.set("v", "K", ":m '<-2<CR>gv=gv", { desc = "Move selected text up" })

-- Deferred: telescope is lazy-loaded, so requiring it at file scope would error.
vim.keymap.set("n", "<leader>sx", function()
  require("telescope.builtin").resume()
end, { noremap = true, silent = true, desc = "Resume last search" })
