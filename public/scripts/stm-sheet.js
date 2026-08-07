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

document.addEventListener("DOMContentLoaded", () => {
  const numericInputs = document.querySelectorAll("input[data-cleave-numeral]");

  numericInputs.forEach((input) => {
    // Clear/select previous input on focus
    input.addEventListener("focus", () => {
      input.select();
    });

    // Format and clean on input
    input.addEventListener("input", (e) => {
      // Apply cleave-zen numeral formatting
      let value = cleaveZen.formatNumeral(e.target.value, {
        numeralThousandsGroupStyle: "none", // Use "thousand" if you want commas (e.g., 1,000)
      });

      // Fallback to strictly strip leading zeroes (e.g., "007" -> "7")
      value = value.replace(/^0+(?=\d)/, "");

      // Prevent completely empty input while typing
      if (value === "") value = "0";

      e.target.value = value;
    });

    // Default to 0 if cleared on blur
    input.addEventListener("blur", (e) => {
      if (e.target.value.trim() === "") {
        e.target.value = "0";
      }
    });
  });
});
