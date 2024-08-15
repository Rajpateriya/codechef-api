const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const cors = require('cors');

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());

async function fetchExternalAPI(handle) {
  const apiUrl = `https://codechef-api.vercel.app/handle/${handle}`;
  try {
    const response = await axios.get(apiUrl);
    console.log(response)
    return response.data;
  } catch (error) {
    throw new Error('Error fetching data from external API');
  }
}

async function scrapeCodeChefProfile(handle) {
  const url =`https://www.codechef.com/users/${handle}`;
  const { data } = await axios.get(url);
  const $ = cheerio.load(data);

  const scrapedData = {
    username: $('.user-details-container .side-nav li')
      .filter((i, el) => $(el).find('label').text().trim() === 'Institution:')
      .find('span')
      .text()
      .trim(),
    problemsSolved: $('h3:contains("Total Problems Solved")').text(),
  };

  return scrapedData;
}

app.get('/codechef/:handle', async (req, res) => {
  try {
    const { handle } = req.params;

    // Fetch external API data
    const externalData = await fetchExternalAPI(handle);

    // Scrape additional data from CodeChef
    const scrapedData = await scrapeCodeChefProfile(handle);

    // Combine both data sets
    const profileData = {
      ...externalData,
      ...scrapedData,
    };

    res.json(profileData);
  } catch (error) {
    console.error('Error scraping data:', error.message);
    res.status(500).json({ error: 'An error occurred while scraping data' });
  }
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});