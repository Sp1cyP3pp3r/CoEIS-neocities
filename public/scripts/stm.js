$(function () {
  /* ---------------------------------------------------------------
     LEFT CLICK  → fill / clear the rating track (your old behaviour)
     RIGHT CLICK → mark this box + every unchecked box after it as
                   "indeterminate" (a partial point)
  --------------------------------------------------------------- */

  $(document).on(
    "change",
    ".point-container input[type='checkbox']",
    function () {
      const $container = $(this).closest(".point-container");
      const $checkboxes = $container.find("input[type='checkbox']");
      const index = $checkboxes.index(this);

      // Any normal left-click interaction wipes every "partial" mark
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
          // There are checked boxes after → re-check the clicked box, uncheck only after
          $checkboxes.eq(index).prop("checked", true);
          $checkboxes.slice(index + 1).prop("checked", false);
        }
        // else: no checked boxes after → browser already unchecked it, do nothing
      }

      // Update .point-total
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

  $(document).on(
    "contextmenu",
    ".point-container input[type='checkbox']",
    function (e) {
      e.preventDefault(); // suppress the browser context menu

      const $container = $(this).closest(".point-container");
      const $checkboxes = $container.find("input[type='checkbox']");
      const index = $checkboxes.index(this);

      // Toggle: right-clicking an already-partial box clears the marks
      const turnOn = !this.indeterminate;

      // The clicked box itself…
      this.indeterminate = turnOn;

      // …plus every unchecked box that comes after it.
      // Checked boxes to the right are left alone.
      $checkboxes
        .slice(index + 1)
        .filter(":not(:checked)")
        .prop("indeterminate", turnOn);
    },
  );
});
