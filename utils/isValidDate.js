exports.isValidDate = (dateString) => {
	// Check if the date string matches the format "YYYY-MM-DD"
	const regex = /^\d{4}-\d{2}-\d{2}$/;
	if (!regex.test(dateString)) {
	  return false;
	}
  
	// Parse the date and check if it's a valid date object
	const date = new Date(dateString);
	if (isNaN(date.getTime())) {
	  return false;
	}
  
	// Ensure the date string components match the parsed date object
	const components = dateString.split('-');
	const year = parseInt(components[0], 10);
	const month = parseInt(components[1], 10);
	const day = parseInt(components[2], 10);
  
	return date.getFullYear() === year && date.getMonth() + 1 === month && date.getDate() === day;
}
  