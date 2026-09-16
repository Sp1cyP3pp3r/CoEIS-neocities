$(function () {
  /* ---------------------------------------------------------------
     LEFT CLICK  → fill left / clear right using `checked`
     RIGHT CLICK → fill left / clear right using `indeterminate`
                   (checked boxes are never modified)
  --------------------------------------------------------------- */

  $(document).on(
    "change",
    ".point-container input[type='checkbox']",
    function () {
      const $container = $(this).closest(".point-container");
      const $checkboxes = $container.find("input[type='checkbox']");
      const index = $checkboxes.index(this);

      // A normal click always wipes every "partial" mark
      $checkboxes.prop("indeterminate", false);

      if (this.checked) {
        // Clicked an UNCHECKED box → fill left (including current), clear right
        $checkboxes.slice(0, index + 1).prop("checked", true);
        $checkboxes.slice(index + 1).prop("checked", false);
      } else {
        // Clicked a CHECKED box (browser already unchecked it)
        const hasCheckedAfter =
          $checkboxes.slice(index + 1).filter(":checked").length > 0;

        if (hasCheckedAfter) {
          $checkboxes.eq(index).prop("checked", true);
          $checkboxes.slice(index + 1).prop("checked", false);
        }
      }

      const totalCount = $container.find(
        "input[type='checkbox']:checked",
      ).length;
      /*
      const $total = $container.find(".point-total").length
        ? $container.find(".point-total")
        : $container.siblings(".point-total");
      $total.text(totalCount);
      */
    },
  );

  /* --- RIGHT CLICK ------------------------------------------------ */

  $(document).on(
    "mousedown",
    ".point-container input[type='checkbox']",
    function (e) {
      if (e.which !== 3) return; // left / middle button → ignore
      e.preventDefault(); // also stops the native menu in most browsers

      const $container = $(this).closest(".point-container");
      const $checkboxes = $container.find("input[type='checkbox']");
      const index = $checkboxes.index(this);

      // 1. Clear every partial mark to the RIGHT (mirrors LMB unchecking them)
      $checkboxes.slice(index + 1).prop("indeterminate", false);

      // 2. Mark this box and everything to its LEFT as partial.
      //    `!this.checked` guarantees already-checked boxes stay untouched.
      $checkboxes.slice(0, index + 1).each(function () {
        this.indeterminate = !this.checked;
      });
    },
  );

  // Belt & braces: swallow the context menu if it still tries to open
  $(document).on(
    "contextmenu",
    ".point-container input[type='checkbox']",
    function (e) {
      e.preventDefault();
    },
  );
});
