$(function () {
  /* ---------------- helpers ---------------- */

  function refreshTotal($container) {
    const totalCount = $container.find("input[type='checkbox']:checked").length;

    const $total = $container.find(".point-total").length
      ? $container.find(".point-total")
      : $container.siblings(".point-total");

    $total.text(totalCount);
  }

  // Wipe every intermediate (right-click) state inside a container
  function clearIntermediate($container) {
    $container.find("input[type='checkbox']").prop("indeterminate", false);
  }

  /* ---------------- left click / spacebar ---------------- */
  $(document).on(
    "change",
    ".point-container input[type='checkbox']",
    function () {
      const $container = $(this).closest(".point-container");
      const $checkboxes = $container.find("input[type='checkbox']");
      const index = $checkboxes.index(this);

      // Any normal toggle cancels the intermediate preview
      clearIntermediate($container);

      if (this.checked) {
        // Clicked an UNCHECKED box → fill left (incl. current), clear right
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

      refreshTotal($container);
    },
  );

  /* ---------------- right click ---------------- */
  $(document).on(
    "contextmenu",
    ".point-container input[type='checkbox']",
    function (e) {
      e.preventDefault(); // no native browser menu

      const $container = $(this).closest(".point-container");
      const $checkboxes = $container.find("input[type='checkbox']");
      const index = $checkboxes.index(this);

      // start from a clean slate
      clearIntermediate($container);

      // the clicked box + every following box that is NOT checked
      $checkboxes.slice(index).each(function () {
        if (!this.checked) {
          this.indeterminate = true;
        }
      });

      refreshTotal($container);
    },
  );
});
