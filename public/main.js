// main.js

document.addEventListener('DOMContentLoaded', () => {
  const tableBody = document.querySelector('tbody');

  fetch('https://hodl-page-demo.onrender.com/api/cryptos')
    .then((response) => response.json())
    .then((data) => {

      data.forEach((crypto) => {
        const { name, last, buy, sell, volume, base_unit } = crypto;

        const priceDifferencePercentage = ((sell - buy) / buy) * 100;
        const colorClass = priceDifferencePercentage >= 0 ? 'green' : 'red';

        const savings = sell - buy;
        const savingsIcon = savings >= 0 ? '▲' : '▼';

        const row = document.createElement('tr');
        row.innerHTML = `
          <td>${name}</td>
          <td>₹${last.toFixed(2)}</td>
          <td>₹${buy.toFixed(2)} / ₹${sell.toFixed(2)}</td>
          <td class="${colorClass}">${priceDifferencePercentage.toFixed(2)}%</td>
          <td class="${colorClass}">${savingsIcon} ₹${Math.abs(savings).toFixed(2)}</td>
        `;
        tableBody.appendChild(row);
      });
    })
    .catch((error) => {
      console.error('Error fetching data:', error);
    });
});
