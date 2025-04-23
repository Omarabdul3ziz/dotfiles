return {
  {
    "almo7aya/openingh.nvim",
    opts = function()
      vim.api.nvim_set_keymap("n", "<Leader>of", ":OpenInGHFile <CR>", { silent = true, noremap = true })
      vim.api.nvim_set_keymap("n", "<Leader>ol", ":OpenInGHFileLines <CR>", { silent = true, noremap = true })
    end,
  },
}
