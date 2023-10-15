import Chart from 'chart.js/auto';

(async function () {
  const data = [
    {
      "userMood": "Sad",
      "mood": "Happy",
      "date": "2023-10-15"
    },
    {
      "userMood": "Happy",
      "mood": "Sad",
      "date": "2023-10-16"
    },
    {
      "userMood": "Relaxed",
      "mood": "Excited",
      "date": "2023-10-17T"
    },
    {
      "userMood": "Excited",
      "mood": "Relaxed",
      "date": "2023-10-18T"
    }
  ];

  const yLabels = data.map(row => row.mood);

  // Convert "userMood" to indices in the yLabels array
  const dataPoints = data.map(row => {
    const index = yLabels.indexOf(row.userMood);
    return index !== -1 ? index : null;
  });

  new Chart(
    document.getElementById('acquisitions'),
    {
      type: 'line',
      data: {
        labels: data.map(row => row.date),
        datasets: [
          {
            label: 'User Mood',
            data: dataPoints,
            borderColor: 'rgba(75, 192, 192, 1)',
            borderWidth: 2,
            fill: false,
          }
        ]
      },
      options: {
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              callback: function (value, index, values) {
                return yLabels[value];
              }
            },
          }
        }
      }
    }
  );
})();



 

 
  