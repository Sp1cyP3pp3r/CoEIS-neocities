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
      if (e.button !== 1) return;

      e.preventDefault();

      const $container = $(this).closest(".point-container");
      const $checkboxes = $container.find("input[type='checkbox']");
      const index = $checkboxes.index(this);

      // Clear indeterminate state to the right.
      $checkboxes.slice(index + 1).prop("indeterminate", false);

      // Mark unchecked boxes up to this point as indeterminate.
      $checkboxes.slice(0, index + 1).each(function () {
        this.indeterminate = !this.checked;
      });
    },
  );
});
