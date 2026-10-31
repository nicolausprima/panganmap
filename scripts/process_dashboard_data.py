"""
Script to process and compile all datasets for the IKP Storytelling Dashboard.
Combines:
- data/raw/dataset_ikp (2018-2026)
- data/raw/dataset_penduduk (Kemiskinan 2018-2025)
- data/raw/dataset_pou (Prevalensi Ketidakcukupan Konsumsi Pangan 2017-2025)
- data/raw/dataset_provinsi (Kerawanan Pangan FIES 2017-2025)
- data/geo/indonesia-38-provinces.geojson
Output: 
- data/processed/dashboard_data.json
- dashboard/js/dashboard_data.js
"""

import os
import json
import pandas as pd
import numpy as np

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_RAW_DIR = os.path.join(BASE_DIR, 'data', 'raw')
DATA_GEO_DIR = os.path.join(BASE_DIR, 'data', 'geo')
DATA_PROCESSED_DIR = os.path.join(BASE_DIR, 'data', 'processed')
DASHBOARD_JS_DIR = os.path.join(BASE_DIR, 'dashboard', 'js')

def run():
    print("Loading IKP datasets...")
    # 1. Load Excel 2018-2023
    excel_path = os.path.join(DATA_RAW_DIR, 'dataset_ikp', 'IPK 2018-2023.xlsx')
    df_excel = pd.read_excel(excel_path, sheet_name='ikp_kab_kota')
    valid_cols = ['NO', 'KODE PROV', 'NAMA PROVINSI', 'KODE KAB/KOTA', 'NAMA KABUPATEN', 'TIPE', 'TAHUN', 'IKP', 'PERINGKAT KAB/KOTA', 'KELOMPOK IKP']
    df_old = df_excel[valid_cols].copy()
    df_old.columns = ['no', 'kode_prov', 'nama_provinsi', 'kode_kab_kota', 'nama_kabupaten', 'tipe', 'tahun', 'ikp', 'peringkat', 'kelompok_ikp']

    def fix_scale(v):
        if pd.isna(v): return None
        v = float(v)
        if v >= 1000: return round(v / 100.0, 2)
        elif v >= 100: return round(v / 10.0, 2)
        return round(v, 2)

    df_old['ikp'] = df_old['ikp'].apply(fix_scale)
    df_old['indeks_ketersediaan'] = None
    df_old['indeks_keterjangkauan'] = None
    df_old['indeks_pemanfaatan'] = None

    kerentanan_map = {
        1: 'Sangat Rentan',
        2: 'Rentan',
        3: 'Agak Rentan',
        4: 'Agak Tahan',
        5: 'Tahan',
        6: 'Sangat Tahan'
    }
    df_old['status_kerentanan'] = df_old['kelompok_ikp'].map(kerentanan_map)

    # 2. Load CSV 2024-2026
    csv_path = os.path.join(DATA_RAW_DIR, 'dataset_ikp', 'IKP 2024-2026.csv')
    df_new_raw = pd.read_csv(csv_path)
    df_new_raw.columns = df_new_raw.columns.str.strip()

    df_new = pd.DataFrame({
        'no': df_new_raw['Nomor'],
        'kode_prov': df_new_raw['Kode Prov'],
        'nama_provinsi': df_new_raw['Nama Provinsi'],
        'kode_kab_kota': df_new_raw['Kode Kab/Kota'],
        'nama_kabupaten': df_new_raw['Nama Kabupaten'],
        'tipe': df_new_raw['Nama Kabupaten'].apply(lambda x: 'Kota' if 'kota' in str(x).lower() else 'Kabupaten'),
        'tahun': df_new_raw['Tahun'],
        'ikp': df_new_raw['IKP'].round(2),
        'peringkat': df_new_raw['PERINGKAT KAB/KOTA'],
        'kelompok_ikp': df_new_raw['KELOMPOK IKP'],
        'status_kerentanan': df_new_raw['Status Kerentanan'].str.strip(),
        'indeks_ketersediaan': df_new_raw['Indeks Ketersediaan'].round(2),
        'indeks_keterjangkauan': df_new_raw['Indeks Keterjangkauan'].round(2),
        'indeks_pemanfaatan': df_new_raw['Indeks Pemanfaatan'].round(2)
    })

    df_all = pd.concat([df_old, df_new], ignore_index=True)
    df_all['nama_provinsi'] = df_all['nama_provinsi'].str.strip().str.title()
    df_all['nama_kabupaten'] = df_all['nama_kabupaten'].str.strip()

    prov_norm = {
        'Di Yogyakarta': 'D.I. Yogyakarta',
        'D.I. Yogyakarta': 'D.I. Yogyakarta',
        'Dki Jakarta': 'DKI Jakarta',
        'Kep. Bangka Belitung': 'Kepulauan Bangka Belitung',
        'Kep. Riau': 'Kepulauan Riau'
    }
    df_all['nama_provinsi'] = df_all['nama_provinsi'].replace(prov_norm)

    # 3. Load Kemiskinan
    print("Loading Kemiskinan data...")
    kem_path = os.path.join(DATA_RAW_DIR, 'dataset_penduduk', 'kemiskinan_p0_provinsi_2018_2025.csv')
    df_kem = pd.read_csv(kem_path)
    df_kem_avg = df_kem.groupby(['provinsi', 'tahun'])['total_persen'].mean().reset_index()
    
    kem_prov_map = {
        'ACEH': 'Aceh',
        'SUMATERA UTARA': 'Sumatera Utara',
        'SUMATERA BARAT': 'Sumatera Barat',
        'RIAU': 'Riau',
        'JAMBI': 'Jambi',
        'SUMATERA SELATAN': 'Sumatera Selatan',
        'BENGKULU': 'Bengkulu',
        'LAMPUNG': 'Lampung',
        'KEP. BANGKA BELITUNG': 'Kepulauan Bangka Belitung',
        'KEP. RIAU': 'Kepulauan Riau',
        'DKI JAKARTA': 'DKI Jakarta',
        'JAWA BARAT': 'Jawa Barat',
        'JAWA TENGAH': 'Jawa Tengah',
        'DI YOGYAKARTA': 'D.I. Yogyakarta',
        'JAWA TIMUR': 'Jawa Timur',
        'BANTEN': 'Banten',
        'BALI': 'Bali',
        'NUSA TENGGARA BARAT': 'Nusa Tenggara Barat',
        'NUSA TENGGARA TIMUR': 'Nusa Tenggara Timur',
        'KALIMANTAN BARAT': 'Kalimantan Barat',
        'KALIMANTAN TENGAH': 'Kalimantan Tengah',
        'KALIMANTAN SELATAN': 'Kalimantan Selatan',
        'KALIMANTAN TIMUR': 'Kalimantan Timur',
        'KALIMANTAN UTARA': 'Kalimantan Utara',
        'SULAWESI UTARA': 'Sulawesi Utara',
        'SULAWESI TENGAH': 'Sulawesi Tengah',
        'SULAWESI SELATAN': 'Sulawesi Selatan',
        'SULAWESI TENGGARA': 'Sulawesi Tenggara',
        'GORONTALO': 'Gorontalo',
        'SULAWESI BARAT': 'Sulawesi Barat',
        'MALUKU': 'Maluku',
        'MALUKU UTARA': 'Maluku Utara',
        'PAPUA BARAT': 'Papua Barat',
        'PAPUA': 'Papua',
        'PAPUA SELATAN': 'Papua Selatan',
        'PAPUA TENGAH': 'Papua Tengah',
        'PAPUA PEGUNUNGAN': 'Papua Pegunungan',
        'PAPUA BARAT DAYA': 'Papua Barat Daya'
    }
    df_kem_avg['nama_provinsi'] = df_kem_avg['provinsi'].map(kem_prov_map).fillna(df_kem_avg['provinsi'].str.title())

    kem_lookup = {}
    for _, r in df_kem_avg.iterrows():
        p = r['nama_provinsi']
        y = int(r['tahun'])
        val = round(float(r['total_persen']), 2) if pd.notna(r['total_persen']) else None
        if p not in kem_lookup:
            kem_lookup[p] = {}
        kem_lookup[p][y] = val

    # 4. National aggregation per year
    print("Aggregating national metrics...")
    years = sorted([int(y) for y in df_all['tahun'].unique()])
    national_stats = {}
    for y in years:
        df_y = df_all[df_all['tahun'] == y]
        ikp_vals = df_y['ikp'].dropna()
        
        grp_counts = df_y['kelompok_ikp'].value_counts().to_dict()
        groups = {
            1: int(grp_counts.get(1, 0)),
            2: int(grp_counts.get(2, 0)),
            3: int(grp_counts.get(3, 0)),
            4: int(grp_counts.get(4, 0)),
            5: int(grp_counts.get(5, 0)),
            6: int(grp_counts.get(6, 0))
        }
        total_kab = len(df_y)
        rentan_total = groups[1] + groups[2] + groups[3]
        tahan_total = groups[4] + groups[5] + groups[6]

        top5_kab = df_y.sort_values(by='ikp', ascending=False).head(5)[['nama_kabupaten', 'nama_provinsi', 'ikp', 'kelompok_ikp', 'status_kerentanan']].to_dict('records')
        bot5_kab = df_y.sort_values(by='ikp', ascending=True).head(5)[['nama_kabupaten', 'nama_provinsi', 'ikp', 'kelompok_ikp', 'status_kerentanan']].to_dict('records')

        prov_y_mean = df_y.groupby('nama_provinsi')['ikp'].mean().round(2).reset_index()
        top5_prov = prov_y_mean.sort_values(by='ikp', ascending=False).head(5).to_dict('records')
        bot5_prov = prov_y_mean.sort_values(by='ikp', ascending=True).head(5).to_dict('records')

        avail = round(float(df_y['indeks_ketersediaan'].dropna().mean()), 2) if df_y['indeks_ketersediaan'].notna().any() else None
        access = round(float(df_y['indeks_keterjangkauan'].dropna().mean()), 2) if df_y['indeks_keterjangkauan'].notna().any() else None
        util = round(float(df_y['indeks_pemanfaatan'].dropna().mean()), 2) if df_y['indeks_pemanfaatan'].notna().any() else None

        national_stats[y] = {
            'mean_ikp': round(float(ikp_vals.mean()), 2),
            'median_ikp': round(float(ikp_vals.median()), 2),
            'std_ikp': round(float(ikp_vals.std()), 2),
            'min_ikp': round(float(ikp_vals.min()), 2),
            'max_ikp': round(float(ikp_vals.max()), 2),
            'total_kab': total_kab,
            'rentan_total': rentan_total,
            'rentan_pct': round((rentan_total / total_kab) * 100, 1),
            'tahan_total': tahan_total,
            'tahan_pct': round((tahan_total / total_kab) * 100, 1),
            'groups': groups,
            'top5_kab': top5_kab,
            'bot5_kab': bot5_kab,
            'top5_prov': top5_prov,
            'bot5_prov': bot5_prov,
            'indeks_ketersediaan': avail,
            'indeks_keterjangkauan': access,
            'indeks_pemanfaatan': util
        }

    # 5. Province level aggregation
    print("Aggregating province metrics...")
    provinces_dict = {}
    prov_names = sorted(df_all['nama_provinsi'].unique())

    geo_code_mapping = {
        'Aceh': 11,
        'Sumatera Utara': 12,
        'Sumatera Barat': 13,
        'Riau': 14,
        'Jambi': 15,
        'Sumatera Selatan': 16,
        'Bengkulu': 17,
        'Lampung': 18,
        'Kepulauan Bangka Belitung': 19,
        'Kepulauan Riau': 21,
        'DKI Jakarta': 31,
        'Jawa Barat': 32,
        'Jawa Tengah': 33,
        'D.I. Yogyakarta': 34,
        'Jawa Timur': 35,
        'Banten': 36,
        'Bali': 51,
        'Nusa Tenggara Barat': 52,
        'Nusa Tenggara Timur': 53,
        'Kalimantan Barat': 61,
        'Kalimantan Tengah': 62,
        'Kalimantan Selatan': 63,
        'Kalimantan Timur': 64,
        'Kalimantan Utara': 65,
        'Sulawesi Utara': 71,
        'Sulawesi Tengah': 72,
        'Sulawesi Selatan': 73,
        'Sulawesi Tenggara': 74,
        'Gorontalo': 75,
        'Sulawesi Barat': 76,
        'Maluku': 81,
        'Maluku Utara': 82,
        'Papua': 91,
        'Papua Barat': 92,
        'Papua Selatan': 93,
        'Papua Tengah': 94,
        'Papua Pegunungan': 95,
        'Papua Barat Daya': 96
    }

    geo_to_provs = {}
    for prov, code in geo_code_mapping.items():
        base_code = code
        if code in [93, 94, 95]:
            base_code = 91
        elif code == 96:
            base_code = 92
        if base_code not in geo_to_provs:
            geo_to_provs[base_code] = []
        geo_to_provs[base_code].append(prov)

    for prov in prov_names:
        df_p = df_all[df_all['nama_provinsi'] == prov]
        code_p = int(df_p['kode_prov'].dropna().iloc[0]) if not df_p['kode_prov'].dropna().empty else geo_code_mapping.get(prov, 0)
        
        yearly_p = {}
        for y in years:
            df_py = df_p[df_p['tahun'] == y]
            if df_py.empty:
                continue
            ikp_vals = df_py['ikp'].dropna()
            if ikp_vals.empty:
                continue
            
            grp_counts = df_py['kelompok_ikp'].value_counts().to_dict()
            rentan_count = sum(grp_counts.get(k, 0) for k in [1, 2, 3])
            tahan_count = sum(grp_counts.get(k, 0) for k in [4, 5, 6])
            tot = len(df_py)

            avail = round(float(df_py['indeks_ketersediaan'].dropna().mean()), 2) if df_py['indeks_ketersediaan'].notna().any() else None
            access = round(float(df_py['indeks_keterjangkauan'].dropna().mean()), 2) if df_py['indeks_keterjangkauan'].notna().any() else None
            util = round(float(df_py['indeks_pemanfaatan'].dropna().mean()), 2) if df_py['indeks_pemanfaatan'].notna().any() else None
            
            poverty = kem_lookup.get(prov, {}).get(y, None)

            yearly_p[y] = {
                'mean_ikp': round(float(ikp_vals.mean()), 2),
                'median_ikp': round(float(ikp_vals.median()), 2),
                'min_ikp': round(float(ikp_vals.min()), 2),
                'max_ikp': round(float(ikp_vals.max()), 2),
                'total_kab': tot,
                'rentan_count': rentan_count,
                'tahan_count': tahan_count,
                'rentan_pct': round((rentan_count / tot) * 100, 1) if tot > 0 else 0,
                'indeks_ketersediaan': avail,
                'indeks_keterjangkauan': access,
                'indeks_pemanfaatan': util,
                'kemiskinan_persen': poverty
            }
        
        provinces_dict[prov] = {
            'nama_provinsi': prov,
            'kode_prov': code_p,
            'geo_code': geo_code_mapping.get(prov, code_p),
            'yearly': yearly_p
        }

    # 6. Map GeoJSON metrics & SVG path generation
    print("Generating SVG paths for Map...")
    geojson_file = os.path.join(DATA_GEO_DIR, 'indonesia-38-provinces.geojson')
    with open(geojson_file, 'r', encoding='utf-8') as f:
        geo = json.load(f)

    width, height, padding = 960, 420, 24
    min_lon, max_lon = 95.0, 141.2
    min_lat, max_lat = -11.1, 6.0

    def proj(lon, lat):
        x = padding + (lon - min_lon) / (max_lon - min_lon) * (width - 2 * padding)
        y = height - padding - (lat - min_lat) / (max_lat - min_lat) * (height - 2 * padding)
        return round(x, 1), round(y, 1)

    def coords_to_path(coords):
        path_d = []
        for ring in coords:
            if not ring: continue
            pts = [proj(pt[0], pt[1]) for pt in ring]
            d = 'M ' + ' L '.join(f'{p[0]},{p[1]}' for p in pts) + ' Z'
            path_d.append(d)
        return ' '.join(path_d)

    geo_map_data = {}
    for feat in geo['features']:
        props = feat['properties']
        base_code = props.get('kode')
        name = props.get('Propinsi')
        geom = feat['geometry']
        g_type = geom['type']
        c = geom['coordinates']

        if g_type == 'Polygon':
            path_d = coords_to_path(c)
        elif g_type == 'MultiPolygon':
            path_d = ' '.join(coords_to_path(poly) for poly in c)
        else:
            path_d = ''

        all_pts = []
        def get_pts(l):
            for item in l:
                if isinstance(item[0], (int, float)):
                    all_pts.append(proj(item[0], item[1]))
                else:
                    get_pts(item)
        get_pts(c)
        cx = round(sum(p[0] for p in all_pts) / len(all_pts), 1) if all_pts else 0
        cy = round(sum(p[1] for p in all_pts) / len(all_pts), 1) if all_pts else 0

        p_list = geo_to_provs.get(base_code, [name])

        yearly_geo = {}
        for y in years:
            df_gy = df_all[(df_all['nama_provinsi'].isin(p_list)) & (df_all['tahun'] == y)]
            if df_gy.empty or df_gy['ikp'].dropna().empty:
                continue
            ikp_vals = df_gy['ikp'].dropna()
            tot = len(df_gy)
            grp_counts = df_gy['kelompok_ikp'].value_counts().to_dict()
            rentan_count = sum(grp_counts.get(k, 0) for k in [1, 2, 3])
            
            povs = [kem_lookup.get(p, {}).get(y) for p in p_list if kem_lookup.get(p, {}).get(y) is not None]
            pov_val = round(sum(povs)/len(povs), 2) if povs else None

            yearly_geo[y] = {
                'mean_ikp': round(float(ikp_vals.mean()), 2),
                'min_ikp': round(float(ikp_vals.min()), 2),
                'max_ikp': round(float(ikp_vals.max()), 2),
                'total_kab': tot,
                'rentan_count': rentan_count,
                'rentan_pct': round((rentan_count / tot) * 100, 1) if tot > 0 else 0,
                'kemiskinan_persen': pov_val
            }

        geo_map_data[base_code] = {
            'geo_code': base_code,
            'name': name,
            'provinces': p_list,
            'd': path_d,
            'centroid': [cx, cy],
            'yearly': yearly_geo
        }

    # 7. Kabupaten records list
    print("Formatting kabupaten records...")
    kab_records = []
    for _, r in df_all.iterrows():
        kab_records.append({
            'tahun': int(r['tahun']),
            'kode_prov': int(r['kode_prov']) if pd.notna(r['kode_prov']) else None,
            'prov': r['nama_provinsi'],
            'kab': r['nama_kabupaten'],
            'tipe': r['tipe'],
            'ikp': float(r['ikp']) if pd.notna(r['ikp']) else None,
            'rank': int(r['peringkat']) if pd.notna(r['peringkat']) else None,
            'grp': int(r['kelompok_ikp']) if pd.notna(r['kelompok_ikp']) else None,
            'status': r['status_kerentanan'],
            'avail': float(r['indeks_ketersediaan']) if pd.notna(r['indeks_ketersediaan']) else None,
            'access': float(r['indeks_keterjangkauan']) if pd.notna(r['indeks_keterjangkauan']) else None,
            'util': float(r['indeks_pemanfaatan']) if pd.notna(r['indeks_pemanfaatan']) else None
        })

    output_data = {
        'viewbox': [0, 0, width, height],
        'years': years,
        'national': national_stats,
        'provinces': provinces_dict,
        'geo_map': geo_map_data,
        'kabupaten': kab_records
    }

    out_file = os.path.join(DATA_PROCESSED_DIR, 'dashboard_data.json')
    with open(out_file, 'w', encoding='utf-8') as f:
        json.dump(output_data, f, ensure_ascii=False)

    out_js = os.path.join(DASHBOARD_JS_DIR, 'dashboard_data.js')
    with open(out_js, 'w', encoding='utf-8') as f:
        f.write('window.DASHBOARD_DATA = ')
        json.dump(output_data, f, ensure_ascii=False)
        f.write(';')

    print(f"Successfully generated {out_file} ({round(os.path.getsize(out_file)/(1024*1024), 2)} MB) and {out_js}")

if __name__ == '__main__':
    run()
