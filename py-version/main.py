import requests
import csv

def get_wikipedia_data(search_term, limit=10):
    base_url = 'https://id.wikipedia.org/w/api.php'
    search_params = {
        'action': 'query',
        'format': 'json',
        'list': 'search',
        'srsearch': search_term,
        'srlimit': limit
    }

    try:
        response = requests.get(base_url, params=search_params)
        response.raise_for_status()
        search_results = response.json().get('query', {}).get('search', [])

        detailed_results = []
        for item in search_results:
            detail_params = {
                'action': 'query',
                'format': 'json',
                'prop': 'extracts|info',
                'exintro': True,
                'explaintext': True,
                'inprop': 'url',
                'pageids': item['pageid']
            }

            detail_response = requests.get(base_url, params=detail_params)
            detail_response.raise_for_status()
            page = detail_response.json().get('query', {}).get('pages', {}).get(str(item['pageid']), {})

            detailed_results.append({
                'title': item['title'],
                'snippet': item['snippet'].replace('<span>', '').replace('</span>', '').replace(',', ';'),
                'pageid': item['pageid'],
                'extract': page.get('extract', ''),
                'fullurl': page.get('fullurl', '')
            })

        return detailed_results
    except requests.RequestException as e:
        print(f'Error fetching data from Wikipedia: {e}')
        return []

def convert_to_csv(data, filename):
    if not data:
        return
    
    with open(filename, 'w', newline='', encoding='utf-8') as file:
        writer = csv.DictWriter(file, fieldnames=data[0].keys())
        writer.writeheader()
        writer.writerows(data)

def main():
    try:
        search_term = 'intitle:A buku'
        results = get_wikipedia_data(search_term, 50)
        filtered_results = [item for item in results if item['title'].lower().startswith('a')]

        if filtered_results:
            convert_to_csv(filtered_results, 'buku_berawalan_a.csv')
            print('Data berhasil disimpan ke buku_berawalan_a.csv')
            print(f'Jumlah buku yang ditemukan: {len(filtered_results)}')
        else:
            print('Tidak ditemukan buku yang berawalan dengan huruf A.')
    except Exception as e:
        print(f'Terjadi kesalahan: {e}')

if __name__ == '__main__':
    main()
