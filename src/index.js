import axios from 'axios';
import fs from 'fs/promises';

async function getWikipediaData(searchTerm, limit = 10) {
    const baseUrl = 'https://id.wikipedia.org/w/api.php';
    const searchParams = {
        action: 'query',
        format: 'json',
        list: 'search',
        srsearch: searchTerm,
        srlimit: limit
    };

    try {
        const response = await axios.get(baseUrl, { params: searchParams });
        const searchResults = response.data.query.search;
        const detailedResults = await Promise.all(
            searchResults.map(async (item) => {
                const detailParams = {
                    action: 'query',
                    format: 'json',
                    prop: 'extracts|info',
                    exintro: true,
                    explaintext: true,
                    inprop: 'url',
                    pageids: item.pageid
                };

                const detailResponse = await axios.get(baseUrl, { params: detailParams });
                const page = detailResponse.data.query.pages[item.pageid];

                return {
                    title: item.title,
                    snippet: item.snippet.replace(/<\/?span[^>]*>/g, '').replace(/,/g, ';'),
                    pageid: item.pageid,
                    extract: page.extract,
                    fullurl: page.fullurl 
                };
            })
        );

        return detailedResults;
    } catch (error) {
        console.error('Error fetching data from Wikipedia:', error.message);
        return [];
    }
}

async function convertToCSV(data) {
    const header = Object.keys(data[0]).join(',');
    const rows = data.map(item => Object.values(item).map(val => `"${val}"`).join(','));
    
    return [header, ...rows].join('\n');
}

const polkadot = async () => {
    try {
        const searchTerm = 'intitle:A buku';
        const results = await getWikipediaData(searchTerm, 50);
        const filteredResults = results.filter(item => item.title.toLowerCase().startsWith('a'));
        
        if (filteredResults.length > 0) {
            const csv = await convertToCSV(filteredResults);
            await fs.writeFile('buku_berawalan_a.csv', csv);
            console.log(`Data berhasil disimpan ke buku_berawalan_a.csv`);
            console.log(`Jumlah buku yang ditemukan: ${filteredResults.length}`);
        } else {
            console.log('Tidak ditemukan buku yang berawalan dengan huruf A.');
        }
    } catch (error) {
        console.error('Terjadi kesalahan:', error);
    }
}

polkadot();
