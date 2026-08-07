$(function () {
  $(document).on("change", ".point-container .point-checkbox", function () {
    const $container = $(this).closest(".point-container");
    const $checkboxes = $container.find(".point-checkbox");
    const index = $checkboxes.index(this);

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
    const totalCount = $container.find(".point-checkbox:checked").length;
    const $total = $container.find(".point-total").length
      ? $container.find(".point-total")
      : $container.siblings(".point-total");
    $total.text(totalCount);
  });
});

/* LIGHT & HEAVY DAMAGE FORMATING */
$(function () {
  const $inputs = $("#light-damage-input, #heavy-damage-input");

  $inputs.each(function () {
    const $input = $(this);

    // Clear previous input before entering new number
    $input.on("focus", function () {
      $(this).select();
    });

    $input.on("input", function () {
      let value = $(this).val();

      // Delete spaces and any non-digit characters
      value = value.replace(/\D/g, "");

      // Trim 0 in the front ("05" -> "5", but leaves a single "0" alone)
      value = value.replace(/^0+(?=\d)/, "");

      // Prevent completely empty input while typing
      if (value === "") value = "0";

      $(this).val(value);
    });

    // Default to 0 if cleared on blur
    $input.on("blur", function () {
      if ($(this).val().trim() === "") {
        $(this).val("0");
      }
    });
  });
});
