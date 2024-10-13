document.getElementById('submitBtn').addEventListener('click', function(event) {
    event.preventDefault(); // Prevent the default form submission
  
    // Get the form element
    const form = document.querySelector('form');
  
    // Use html2canvas to capture the form as an image
    html2canvas(form).then(canvas => {
      const { jsPDF } = window.jspdf;
      const doc = new jsPDF('p', 'pt', 'a4');
  
      // Calculate the scale to fit the form in the PDF
      const imgData = canvas.toDataURL('image/png');
      const imgWidth = doc.internal.pageSize.getWidth();
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
  
      // Add the captured form image to the PDF
      doc.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
  
      // Save the PDF
      doc.save('styled-form-data.pdf');
    });
  });
  