// helpers/formFiller.js
export async function fillPopupForm(page, openButtonSelector, fieldMap) {
  await page.waitForSelector(openButtonSelector, { visible: true });
  await page.click(openButtonSelector);
  await page.waitForSelector('.modal-content', { visible: true });

  for (const [selector, value] of Object.entries(fieldMap)) {
    try {
      if (selector.startsWith("select")) {
        await page.select(selector, value);
      } else {
        await page.waitForSelector(selector, { visible: true });
        await page.click(selector, { clickCount: 3 });
        await page.type(selector, value, { delay: 30 });
      }
    } catch (err) {
      console.warn(`Failed to fill ${selector}:`, err.message);
    }
  }

  await page.click('.modal-content .btn-primary');
  await page.waitForSelector('.modal-content', { hidden: true });
}
