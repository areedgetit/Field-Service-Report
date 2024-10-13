document.getElementById('submitBtn').addEventListener('click', function(event) {
    event.preventDefault(); // Prevent the default form submission

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF('portrait', 'pt', 'a4'); // Use A4 size for better compatibility

    // Collect form data
    const formData = new FormData(document.querySelector('form'));
    let yPosition = 20; // Starting Y position
    const lineHeight = 15; // Line height

    // Loop through form data and add it to the PDF
    formData.forEach((value, key) => {
        doc.text(`${key}: ${value}`, 20, yPosition);
        yPosition += lineHeight; // Move down for the next line
    });

    doc.save('form-data.pdf');
});