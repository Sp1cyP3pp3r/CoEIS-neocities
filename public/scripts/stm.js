$(function () {
  /* ---------------------------------------------------------------
     LEFT CLICK   → fill left / clear right using `checked`
     MIDDLE CLICK → fill left / clear right using `indeterminate`
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
        $checkboxes.slice(0, index + 1).prop("checked", true);
        $checkboxes.slice(index + 1).prop("checked", false);
      } else {
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

  /* --- MIDDLE CLICK ---------------------------------------------- */

  $(document).on(
    "mousedown",
    ".point-container input[type='checkbox']",
    function (e) {
      if (e.which !== 2) return; // only the middle button
      e.preventDefault(); // stops autoscroll starting

      const $container = $(this).closest(".point-container");
      const $checkboxes = $container.find("input[type='checkbox']");
      const index = $checkboxes.index(this);

      // 1. Clear every partial mark to the RIGHT (mirrors LMB unchecking)
      $checkboxes.slice(index + 1).prop("indeterminate", false);

      // 2. Mark this box and everything to its LEFT as partial.
      //    `!this.checked` keeps already-checked boxes untouched.
      $checkboxes.slice(0, index + 1).each(function () {
        this.indeterminate = !this.checked;
      });
    },
  );

  // Middle-click also fires `auxclick` in modern browsers (used for
  // "open in new tab"); swallow it on checkboxes so nothing else reacts.
  $(document).on(
    "auxclick",
    ".point-container input[type='checkbox']",
    function (e) {
      if (e.which === 2) e.preventDefault();
    },
  );
});
