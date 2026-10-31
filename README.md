# Dokumentasi Komprehensif Metode Visualisasi & Storytelling Data
## Dashboard Ketahanan Pangan & 4 Notebook Exploratory Data Analysis (EDA)

Dokumen ini merangkum secara lengkap dan rinci seluruh metode statistik, logika perhitungan, teknik pengolahan data, serta prinsip visualisasi (*Storytelling with Data*) yang digunakan pada setiap grafik/chart di dalam proyek ini, baik pada Interactive Web Dashboard maupun pada 4 Notebook EDA, tanpa menggunakan notasi LaTeX agar mudah dibaca di seluruh editor markdown.

---

## Daftar Isi
1. [Struktur Direktori Proyek](#struktur-direktori-proyek)
2. [Prinsip Desain & Storytelling Data Universal](#prinsip-desain--storytelling-data-universal)
3. [Bagian I: Visualisasi pada Interactive Web Dashboard (SIKAP Pangan)](#bagian-i-visualisasi-pada-interactive-web-dashboard-sikap-pangan)
   - [1.1 Hero Metric KPI Cards (5 Kartu Metrik Kunci)](#11-hero-metric-kpi-cards-5-kartu-metrik-kunci)
   - [1.2 Peta Choropleth Sebaran Ketahanan Pangan](#12-peta-choropleth-sebaran-ketahanan-pangan)
   - [1.3 Chart 1: Tren Temporal Longitudinal 2018–2026](#13-chart-1-tren-temporal-longitudinal-20182026)
   - [1.4 Chart 2: Kesenjangan Daerah Tertinggi & Terendah (Top vs Bottom)](#14-chart-2-kesenjangan-daerah-tertinggi--terendah-top-vs-bottom)
   - [1.5 Chart 3: Dekomposisi Tiga Pilar Ketahanan Pangan](#15-chart-3-dekomposisi-tiga-pilar-ketahanan-pangan)
   - [1.6 Chart 4: Diagram Pencar Korelasi Kemiskinan (P0) vs IKP](#16-chart-4-diagram-pencar-korelasi-kemiskinan-p0-vs-ikp)
   - [1.7 Tabel Eksplorasi Daerah & Ekspor Data](#17-tabel-eksplorasi-daerah--ekspor-data)
4. [Bagian II: Visualisasi pada Notebook 1 (EDA Dataset IKP)](#bagian-ii-visualisasi-pada-notebook-1-eda-dataset-ikp)
5. [Bagian III: Visualisasi pada Notebook 2 (EDA Dataset Penduduk & Kemiskinan)](#bagian-iii-visualisasi-pada-notebook-2-eda-dataset-penduduk--kemiskinan)
6. [Bagian IV: Visualisasi pada Notebook 3 (EDA Dataset PoU)](#bagian-iv-visualisasi-pada-notebook-3-eda-dataset-pou)
7. [Bagian V: Visualisasi pada Notebook 4 (EDA Dataset Provinsi FIES)](#bagian-v-visualisasi-pada-notebook-4-eda-dataset-provinsi-fies)
8. [Tabel Matriks Ringkasan Seluruh Metode](#tabel-matriks-ringkasan-seluruh-metode)

---

## Struktur Direktori Proyek

```text
.
├── dashboard/
│   ├── css/
│   │   ├── style.css             # Desain antarmuka utama (tema Slate & Cobalt)
│   │   ├── tokens.css            # Token desain (palet warna, tipografi, radius)
│   │   └── base.css              # Reset dasar & utilitas layout UI
│   ├── js/
│   │   ├── app.js                # State management, filter reaktif, visualisasi SVG/Canvas
│   │   └── dashboard_data.js     # Master data terkompilasi (dukungan offline / file://)
│   └── index.html                # Halaman interaktif Web Dashboard SIKAP Pangan
├── data/
│   ├── geo/
│   │   ├── indonesia-38-provinces.geojson  # Batas spasial poligon 38 provinsi
│   │   └── indonesia-province-simple.json # Data ringkas batas wilayah
│   ├── processed/
│   │   └── dashboard_data.json   # JSON teragregasi siap pakai untuk dashboard
│   └── raw/
│       ├── dataset_ikp/          # Data IKP Bapanas (Excel 2018-2023, CSV 2024-2026)
│       ├── dataset_penduduk/     # Kemiskinan P0 BPS semesteran (2018-2025)
│       ├── dataset_pou/          # CSV rilis tahunan PoU BPS (2017-2025)
│       └── dataset_provinsi/     # CSV rilis tahunan FIES BPS (2017-2025)
├── docs/
│   └── references/               # 5 Dokumen panduan Storytelling with Data (Cole Knaflic)
├── notebooks/
│   ├── 01_EDA_Dataset_IKP.ipynb                       # Notebook EDA Master IKP
│   ├── 02_EDA_Dataset_Penduduk_Kemiskinan.ipynb       # Notebook EDA Kemiskinan BPS
│   ├── 03_EDA_Dataset_PoU.ipynb                       # Notebook EDA PoU BPS
│   └── 04_EDA_Dataset_Provinsi_Kerawanan_Pangan.ipynb # Notebook EDA FIES Provinsi
├── scripts/
│   └── process_dashboard_data.py # Pipeline ETL data mentah ke format siap visualisasi
└── README.md                     # Dokumentasi komprehensif proyek
```

---

## Prinsip Desain & Storytelling Data Universal
Seluruh visualisasi dirancang mengikuti kaidah Cole Nussbaumer Knaflic (*Storytelling with Data*):
1. **Meminimalkan Beban Kognitif (*Clutter Reduction*):** Menghilangkan garis tepi tebal (*heavy borders*), latar belakang gelap yang tidak perlu, dan efek 3D. Gridline menggunakan garis rambut 1px yang samar (*hairline gridlines*).
2. **Pelabelan Langsung (*Direct Labeling*):** Menghindari legenda terpisah yang memaksa mata bolak-balik membaca kode. Teks angka dan kategori ditempatkan langsung di ujung batang atau titik garis.
3. **Pewarnaan Bertujuan (*Intentional & Colorblind-Safe Palette*):**
   - **Biru Cobalt / Hijau:** Menandakan kondisi positif, aman pangan (*Tahan / Sangat Tahan*).
   - **Amber / Oranye / Merah:** Menandakan kondisi waspada, risiko tinggi (*Rentan / Sangat Rentan* atau *Bottleneck*).
   - **Abu-abu / Slate:** Digunakan untuk baseline netral dan konteks latar belakang.

---

## Bagian I: Visualisasi pada Interactive Web Dashboard (SIKAP Pangan)
**Berkas Sumber:** [`index.html`](file:///C:/Coding%20SDT/VS%20Code/Python/Semester%205/Presentasi%20dan%20Storytelling%20Data/Tugas%20Kelompok/dashboard/index.html), [`app.js`](file:///C:/Coding%20SDT/VS%20Code/Python/Semester%205/Presentasi%20dan%20Storytelling%20Data/Tugas%20Kelompok/dashboard/js/app.js), [`dashboard_data.json`](file:///C:/Coding%20SDT/VS%20Code/Python/Semester%205/Presentasi%20dan%20Storytelling%20Data/Tugas%20Kelompok/data/processed/dashboard_data.json)

### 1.1 Hero Metric KPI Cards (5 Kartu Metrik Kunci)
*Fungsi:* [`renderKpis`](file:///C:/Coding%20SDT/VS%20Code/Python/Semester%205/Presentasi%20dan%20Storytelling%20Data/Tugas%20Kelompok/dashboard/js/app.js#L330-L385)

| Kartu Metrik | Nilai Contoh (2025) | Variabel Sumber | Metode & Formula Perhitungan | Tujuan & Penjelasan Visual |
|---|---|---|---|---|
| **1. Skor Ketahanan Nasional** | `69.70 / 100`<br>`+1.66 vs tahun lalu`<br>*Agak Tahan* | `IKP` ([`IKP 2024-2026.csv`](file:///C:/Coding%20SDT/VS%20Code/Python/Semester%205/Presentasi%20dan%20Storytelling%20Data/Tugas%20Kelompok/data/raw/data/raw/dataset_ikp/IKP%202024-2026.csv)) | **Rata-rata Aritmatika Agregat:**<br>Rata-rata = (Total Skor IKP 514 Kab/Kota) / 514 = 69.70<br>**Delta Tahunan:**<br>Delta = Rata-rata 2025 - Rata-rata 2024 = 69.70 - 68.04 = +1.66<br>**Klasifikasi Status:**<br>Rentang skor 65.0 sampai 74.9 masuk kategori *Agak Tahan* | *Dark Hero Card* berkontras tinggi untuk memfokuskan perhatian utama audiens pada performa makro nasional. |
| **2. Ketahanan Daerah** | `84.2%`<br>*433 dari 514 daerah* | `KELOMPOK IKP` | **Proporsi Relatif Daerah Tahan:**<br>Rasio = (Jumlah Daerah Kelompok 4, 5, 6 / Total Kab-Kota) x 100%<br>= (433 / 514) x 100% = 84.24% (dibulatkan 84.2%) | Menunjukkan seberapa luas penetrasi stabilitas ketahanan pangan di tingkat kabupaten/kota se-Indonesia. |
| **3. Daerah Rentan Pangan** | `81`<br>*Prioritas 1 sampai 3* | `KELOMPOK IKP` | **Headcount Kelompok Rawan:**<br>Total = Jumlah Daerah (Kelompok 1 + Kelompok 2 + Kelompok 3)<br>= 20 + 19 + 42 = 81 daerah | Badge peringatan berwarna oranye untuk menegaskan target daerah yang mendesak diberi bantuan logistik pangan. |
| **4. Kesenjangan Skor Wilayah** | `68.9`<br>*Skor 19.9 s/d 88.8* | `IKP` | **Rentang Dispersi (Range):**<br>Range = Skor Tertinggi - Skor Terendah<br>= 88.79 - 19.93 = 68.86 (dibulatkan 68.9) | Mengukur derajat ketimpangan spasial antara daerah paling mandiri (Badung 88.8) vs paling tertinggal (Nduga 19.9). |
| **5. Kemiskinan P0** | `10.44%`<br>*Rerata Provinsi (BPS)* | `total_persen` ([`kemiskinan_p0...csv`](file:///C:/Coding%20SDT/VS%20Code/Python/Semester%205/Presentasi%20dan%20Storytelling%20Data/Tugas%20Kelompok/data/raw/data/raw/dataset_penduduk/kemiskinan_p0_provinsi_2018_2025.csv)) | **Rerata Persentase Provinsi:**<br>Rerata = (Total Persentase Kemiskinan 38 Provinsi) / 38 = 10.44% | Mengaitkan status pangan dengan daya beli moneter masyarakat menurut data Susenas BPS 2025. |

---

### 1.2 Peta Choropleth Sebaran Ketahanan Pangan
*Fungsi:* [`renderMap`](file:///C:/Coding%20SDT/VS%20Code/Python/Semester%205/Presentasi%20dan%20Storytelling%20Data/Tugas%20Kelompok/dashboard/js/app.js#L388-L480) | *Elemen:* `<svg id="mapSvg">`
* **Tipe Visual:** *Interactive Geographic Choropleth Map* (Format SVG berbasis GeoJSON 38 Provinsi Indonesia).
* **Metode Pemetaan Skala Warna (*Stepped Color Quantization*):**
  Menggunakan skala diskrit 5 interval (*binned thresholds*) untuk mempermudah identifikasi zona:
  - **Skor kurang dari 55.0 (Amber/Oranye Pekat):** Sangat Rentan.
  - **Skor 55.0 sampai 67.9 (Krem/Pasir Hangat):** Rentan / Di Bawah Rata-rata.
  - **Skor 68.0 sampai 74.9 (Slate Netral):** Agak Tahan (Sekitar Rata-rata Nasional ~71).
  - **Skor 75.0 sampai 81.9 (Biru Cobalt Sedang):** Tahan.
  - **Skor 82.0 ke atas (Deep Cobalt / Biru Laut Tua):** Sangat Tahan.
* **Metode Interaktivitas:**
  - *Reactive Cross-Filtering:* Klik poligon memicu pembaruan filter `selectedProvince` ke seluruh dashboard secara otomatis.
  - *Dynamic Tooltip:* Menghitung posisi koordinat mouse (clientX, clientY) yang dibatasi dalam batas layar (*viewport bounding*) agar tidak terpotong.

---

### 1.3 Chart 1: Tren Temporal Longitudinal 2018–2026
*Fungsi:* [`renderChartTrend`](file:///C:/Coding%20SDT/VS%20Code/Python/Semester%205/Presentasi%20dan%20Storytelling%20Data/Tugas%20Kelompok/dashboard/js/app.js#L533-L689) | *Elemen:* `<div id="chartTrend">`
* **Tipe Visual:** *Longitudinal Multi-Line Chart with Dual-Series Benchmarking*.
* **Metode Statistik & Algoritma:**
  1. **Interpolasi Koordinat Sumbu:**
     - Posisi X = padding_kiri + indeks_tahun * ((lebar_grafik - padding_kiri - padding_kanan) / (jumlah_tahun - 1))
     - Posisi Y = tinggi_grafik - padding_bawah - ((nilai - y_min) / (y_max - y_min)) * (tinggi_grafik - padding_atas - padding_bawah)
  2. **Batas Sumbu Y Adaptif (*Adaptive Bounding*):**
     Algoritma secara otomatis mendeteksi nilai minimum data. Jika wilayah memiliki skor rendah seperti Papua (skor di bawah 42), batas bawah sumbu Y otomatis diturunkan ke 20 atau 35 agar garis tidak menembus batas bawah grafik.
  3. **Segmentasi Kontinuitas Jalur (*Segmented Path Continuity*):** Menghindari garis penghubung miring palsu jika ada tahun yang bernilai kosong (*null*).
  4. **Benchmarking Nasional:** Garis putus-putus (*dashed line*) rata-rata nasional ditampilkan sebagai jangkar konteks pembanding jika pengguna memilih salah satu provinsi.

---

### 1.4 Chart 2: Kesenjangan Daerah Tertinggi & Terendah (Top vs Bottom)
*Fungsi:* [`renderChartRanking`](file:///C:/Coding%20SDT/VS%20Code/Python/Semester%205/Presentasi%20dan%20Storytelling%20Data/Tugas%20Kelompok/dashboard/js/app.js#L692-L774) | *Elemen:* `<div id="chartRanking">`
* **Tipe Visual:** *Horizontal Diverging Bar Chart with Background Track*.
* **Metode Statistik & Algoritma:**
  1. **Seleksi Nilai Ekstrem (*Extreme Value Slicing*):** Mengurutkan data secara menurun (*descending*), lalu mengambil Top 3 daerah tertinggi dan Bottom 3 daerah terendah.
  2. **Encoding Skala Batang Penuh (0–100):** Setiap batang diletakkan di atas *track background* abu-abu terang sepanjang skor 100 agar pembaca memahami rasio pencapaian terhadap skor ideal.
  3. **Diverging Color Encoding:**
     - Batang Top (Tahan): Diberi warna Biru Cobalt.
     - Batang Bottom (Rentan): Diberi warna Amber Waspada.
  4. **Pemotongan Teks Otomatis (*Clean Truncation*):** Nama kabupaten lebih dari 18 karakter dipotong dan diberi elipsis (`…`) agar label tetap rapi dan tidak bertumpukan.

---

### 1.5 Chart 3: Dekomposisi Tiga Pilar Ketahanan Pangan
*Fungsi:* [`renderChartPillars`](file:///C:/Coding%20SDT/VS%20Code/Python/Semester%205/Presentasi%20dan%20Storytelling%20Data/Tugas%20Kelompok/dashboard/js/app.js#L781-L869) | *Elemen:* `<div id="chartPillars">`
* **Tipe Visual:** *Grouped Horizontal Progress Bar with Bottleneck Highlighting*.
* **Metode Statistik & Algoritma:**
  1. **Dekomposisi Sub-Indeks Komposit (2024–2026):**
     - Pilar 1: **Keterjangkauan Pangan** (*Food Accessibility* - Akses fisik dan ekonomi)
     - Pilar 2: **Pemanfaatan Pangan** (*Food Utilization* - Gizi, air bersih, dan sanitasi)
     - Pilar 3: **Ketersediaan Pangan** (*Food Availability* - Produksi dan cadangan pangan)
  2. **Deteksi Titik Hambat (*Bottleneck Highlighting*):**
     Pilar Ketersediaan diberi kelas visual khusus (`chart-bar-fill--rentan`, warna oranye) karena secara statistik memiliki rata-rata nasional paling rendah (~61.1) dibanding Keterjangkauan (~84.8) dan Pemanfaatan (~72.3).

---

### 1.6 Chart 4: Diagram Pencar Korelasi Kemiskinan (P0) vs IKP
*Fungsi:* [`renderChartScatter`](file:///C:/Coding%20SDT/VS%20Code/Python/Semester%205/Presentasi%20dan%20Storytelling%20Data/Tugas%20Kelompok/dashboard/js/app.js#L876-L985) | *Elemen:* `<div id="chartScatter">`
* **Tipe Visual:** *2D Bivariate Scatterplot with Interactive Quadrant Selection*.
* **Metode Statistik & Algoritma:**
  1. **Pemetaan Kartesius Kontinu:**
     - Sumbu X: Persentase Penduduk Miskin (P0 BPS, rentang 0% sampai 35%).
     - Sumbu Y: Skor IKP Provinsi (rentang 20 sampai 100).
  2. **Analisis Kuadran Kerentanan Ganda (*Double Vulnerability*):**
     Wilayah di kuadran kanan bawah (Kemiskinan tinggi di atas 15% dan IKP rendah di bawah 60) ditandai sebagai zona krisis multidimensi yang membutuhkan intervensi ganda.
  3. **Visual Encoding Interaktif:**
     Titik provinsi yang dipilih pengguna membesar dari radius r = 4 menjadi r = 7 dengan garis tepi tebal 2.5px. Titik dapat diklik untuk memilih provinsi secara langsung.

---

### 1.7 Tabel Eksplorasi Daerah & Ekspor Data
*Fungsi:* [`renderTable`](file:///C:/Coding%20SDT/VS%20Code/Python/Semester%205/Presentasi%20dan%20Storytelling%20Data/Tugas%20Kelompok/dashboard/js/app.js#L987-L1090), [`exportCsv`](file:///C:/Coding%20SDT/VS%20Code/Python/Semester%205/Presentasi%20dan%20Storytelling%20Data/Tugas%20Kelompok/dashboard/js/app.js#L1128-L1160)
* **Metode Komputasi:**
  1. **Pengurutan Klien Dinamis (*Client-side Multi-type Sorting*):** Mengurutkan data secara numerik maupun alfabetis saat judul kolom diklik.
  2. **Pencarian Substring Teks (*Case-insensitive Substring Filter*):** Menyaring nama kabupaten, kota, atau provinsi secara instan saat pengguna mengetik kata kunci.
  3. **Paginasi Dinamis (*Chunking Pagination*):** Membagi ribuan baris data menjadi 10 item per halaman untuk menjaga kecepatan rendering tampilan browser.
  4. **Ekspor CSV Klien:** Membuat objek Blob dan URL unduhan instan langsung pada peramban web tanpa beban pemrosesan server backend.

---

## Bagian II: Visualisasi pada Notebook 1 (EDA Dataset IKP)
**Berkas Sumber:** [notebooks/01_EDA_Dataset_IKP.ipynb](file:///C:/Coding%20SDT/VS%20Code/Python/Semester%205/Presentasi%20dan%20Storytelling%20Data/Tugas%20Kelompok/notebooks/01_EDA_Dataset_IKP.ipynb)  
**Dataset:** [`data/raw/dataset_ikp/IPK 2018-2023.xlsx`](file:///C:/Coding%20SDT/VS%20Code/Python/Semester%205/Presentasi%20dan%20Storytelling%20Data/Tugas%20Kelompok/data/raw/data/raw/dataset_ikp/IPK%202018-2023.xlsx) & [`data/raw/dataset_ikp/IKP 2024-2026.csv`](file:///C:/Coding%20SDT/VS%20Code/Python/Semester%205/Presentasi%20dan%20Storytelling%20Data/Tugas%20Kelompok/data/raw/data/raw/dataset_ikp/IKP%202024-2026.csv) (4.626 Baris Panel Master)

| No | Nama Visualisasi | Tipe Plot | Library | Metode Statistik & Logika Perhitungan | Insight Storytelling |
|---|---|---|---|---|---|
| **1.1** | Tren Rata-rata & Median IKP Nasional | Line Plot dengan Area Pita | `matplotlib.pyplot` | - Menghitung Mean dan Median tahunan dari 514 daerah<br>- Area pita simpangan baku: Mean +/- 1 Standar Deviasi<br>- Label teks langsung pada setiap titik data tahunan | Memperlihatkan tren perbaikan skor IKP nasional dari 68.4 (2018) ke 71.7 (2026). Median selalu lebih tinggi dari mean karena adanya tarikan daerah ekstrem bawah. |
| **1.2** | Distribusi Skor IKP per Tahun | Boxplot Distribusi | `seaborn.boxplot` | - Ringkasan 5 angka: Nilai Minimum, Kuartil 1, Median, Kuartil 3, Nilai Maksimum<br>- Deteksi Outlier: Titik di bawah Q1 - (1.5 x IQR) | Mengidentifikasi bahwa daerah outlier ekstrem bawah (skor di bawah 30) terkonsentrasi persisten di daerah pegunungan Papua. |
| **1.3** | Dinamika Proporsi Kelompok Kerentanan | 100% Stacked Bar Chart | `pandas.DataFrame.plot` | - Tabulasi silang dinormalisasi: Proporsi = (Frekuensi Kelompok / Total Daerah) x 100%<br>- 6 warna diskrit standar FSVA Bapanas | Menunjukkan keberhasilan penyusutan proporsi daerah rawan (Kelompok 1-3) dan ekspansi daerah tahan (Kelompok 5-6) yang melampaui 60% daerah nasional. |
| **1.4** | Peringkat Ekstrem: Top 10 vs Bottom 10 Daerah | Paired Horizontal Bar Charts | `seaborn.barplot` | - Rata-rata skor 3 tahun terakhir (2024–2026) per kabupaten/kota<br>- Pengurutan ascending dan descending | Mengontraskan daerah paling tahan pangan (Badung, Gianyar, Tabanan dengan skor di atas 86) vs daerah paling rentan (Nduga, Yahukimo, Dogiyai dengan skor di bawah 35). |
| **1.5** | Distribusi IKP Menurut Wilayah Kepulauan | Grouped Boxplot Antar-Pulau | `seaborn.boxplot` | - Klasifikasi 7 pulau besar: Sumatera, Jawa, Bali-Nusa Tenggara, Kalimantan, Sulawesi, Maluku, Papua<br>- Pengurutan berdasarkan median | Mengonfirmasi ketimpangan tajam kawasan Barat vs Timur. Jawa dan Bali sangat stabil dan seragam, sementara Papua memiliki variabilitas terlebar di Indonesia. |
| **1.6** | Tren IKP Antar-Kawasan Sepanjang Waktu | Multi-series Line Chart | `matplotlib.pyplot` | - Rata-rata longitudinal tahunan per gugus kepulauan dari 2018 ke 2026 | Membuktikan bahwa jarak kesenjangan antar-kawasan relatif stabil dan belum menunjukkan konvergensi penuh. |
| **1.7** | Perbandingan Distribusi Kabupaten vs Kota | Kernel Density Estimation (KDE) | `seaborn.kdeplot` | - Estimasi kurva densitas probabilitas Gaussian kontinu untuk tipe Kabupaten vs Kota | Kurva distribusi Kota bergeser jauh ke kanan dibanding Kabupaten (median Kota sekitar 78 vs Kabupaten sekitar 71). |
| **1.8** | Kesenjangan IKP Kota vs Kabupaten | Longitudinal Line Chart | `matplotlib.pyplot` | - Selisih rata-rata tahunan: Gap = Rerata Kota - Rerata Kabupaten | Kesenjangan konstan berada pada margin +6 sampai +9 poin karena keunggulan akses logistik dan infrastruktur perkotaan. |
| **1.9** | Matriks Korelasi Antar-Pilar Ketahanan Pangan | Heatmap Korelasi Pearson | `seaborn.heatmap` | - Koefisien korelasi linear Pearson antara Ketersediaan, Keterjangkauan, Pemanfaatan, dan IKP Total | Ketiga pilar berkorelasi positif kuat terhadap IKP (nilai r di atas 0.81), dengan pilar Ketersediaan memiliki hubungan terkuat (r = 0.840). |
| **1.10** | Rata-rata Skor Pilar Menurut Status Kerentanan | Grouped Bar Chart | `pandas.DataFrame.plot` | - Agregasi rata-rata skor ketiga pilar menurut 6 status kerentanan wilayah | Membuktikan secara empiris bahwa pada daerah Sangat Rentan, pilar Ketersediaan anjlok ke 20.73 dan Pemanfaatan ke 34.00, padahal Keterjangkauan masih di angka 54.04. |

---

## Bagian III: Visualisasi pada Notebook 2 (EDA Dataset Penduduk & Kemiskinan)
**Berkas Sumber:** [notebooks/02_EDA_Dataset_Penduduk_Kemiskinan.ipynb](file:///C:/Coding%20SDT/VS%20Code/Python/Semester%205/Presentasi%20dan%20Storytelling%20Data/Tugas%20Kelompok/notebooks/02_EDA_Dataset_Penduduk_Kemiskinan.ipynb)  
**Dataset:** [`data/raw/dataset_penduduk/kemiskinan_p0_provinsi_2018_2025.csv`](file:///C:/Coding%20SDT/VS%20Code/Python/Semester%205/Presentasi%20dan%20Storytelling%20Data/Tugas%20Kelompok/data/raw/data/raw/dataset_penduduk/kemiskinan_p0_provinsi_2018_2025.csv) (624 Baris Semesteran)

| No | Nama Visualisasi | Tipe Plot | Library | Metode Statistik & Logika Perhitungan | Insight Storytelling |
|---|---|---|---|---|---|
| **2.1** | Tren Tingkat Kemiskinan Nasional P0 | Line Chart dengan Anotasi Ekstrem | `matplotlib.pyplot` | - Pelacakan deret waktu semesteran (Maret dan September 2018–2025)<br>- Anotasi titik puncak pandemi dan titik terendah | Menunjukkan guncangan krisis COVID-19 di mana kemiskinan melonjak ke 10.19% pada September 2020, lalu melandai turun ke titik terendah 8.25%–8.47% pada 2025. |
| **2.2** | Kesenjangan Kemiskinan: Kota vs Desa | Dual Line Chart | `matplotlib.pyplot` | - Pelacakan terpisah persentase perkotaan vs perdesaan nasional | Kemiskinan di perdesaan (11%–13%) konsisten hampir dua kali lipat lebih tinggi dari perkotaan (7%–8%). |
| **2.3** | Top 10 Provinsi Jurang Desa-Kota Terlebar | Horizontal Bar Chart | `matplotlib.pyplot` | - Perhitungan selisih absolut: Gap = Persentase Desa - Persentase Kota (Maret 2025) | Papua Barat, Papua, dan Maluku memiliki jurang kemiskinan desa-kota paling ekstrem (selisih mencapai 15% sampai 20%). |
| **2.4** | 10 Provinsi Termiskin vs 10 Terendah 2025 | Paired Horizontal Bar Charts | `seaborn.barplot` | - Peringkat provinsi dengan garis acuan benchmark rata-rata nasional (8.47%) | Menampilkan polarisasi tajam: Bali dan DKI Jakarta (di bawah 4%) vs Papua Pegunungan (30.03%) dan Papua Tengah (28.90%). |
| **2.5** | Distribusi Kemiskinan Antar-Gugus Pulau | Boxplot Komparatif | `seaborn.boxplot` | - Ringkasan 5 angka kemiskinan per gugus kepulauan (2024–2025) | Wilayah Papua dan Nusa Tenggara memiliki sebaran kemiskinan tertinggi dengan variabilitas antar-provinsi yang sangat lebar. |
| **2.6** | Rerata Kemiskinan Kota vs Desa Antar-Pulau | Grouped Bar Chart | `pandas.DataFrame.plot` | - Rata-rata 2 variabel: Gugus Pulau dan Sektor Wilayah (Kota vs Desa) | Memperlihatkan bahwa beban kemiskinan perdesaan tertinggi secara nasional terkonsentrasi di Kawasan Timur Indonesia. |
| **2.7** | Peta Panas Dinamika Kemiskinan Provinsi | Matrix Heatmap Spasial-Temporal | `seaborn.heatmap` | - Matriks 38 Provinsi x 8 Tahun survei Maret, diurutkan dari persentase 2025 | Memperlihatkan konsistensi zona merah (kantong kemiskinan struktural menahun) dan zona hijau (daerah berpenghasilan mapan). |
| **2.8** | Evaluasi Laju Penurunan (Konvergensi Daerah) | Scatterplot dengan Ukuran Bubble | `seaborn.scatterplot` | - Sumbu X: Kemiskinan Awal 2018<br>- Sumbu Y: Perubahan Poin = P0 2025 - P0 2018<br>- Ukuran titik proporsional terhadap kemiskinan akhir | Menguji konvergensi: provinsi tertinggal mengalami penurunan poin lebih besar, namun kecepatannya belum menutup kesenjangan secara total. |

---

## Bagian IV: Visualisasi pada Notebook 3 (EDA Dataset PoU)
**Berkas Sumber:** [notebooks/03_EDA_Dataset_PoU.ipynb](file:///C:/Coding%20SDT/VS%20Code/Python/Semester%205/Presentasi%20dan%20Storytelling%20Data/Tugas%20Kelompok/notebooks/03_EDA_Dataset_PoU.ipynb)  
**Dataset:** 9 Berkas CSV Tahunan di [`data/raw/dataset_pou/`](file:///C:/Coding%20SDT/VS%20Code/Python/Semester%205/Presentasi%20dan%20Storytelling%20Data/Tugas%20Kelompok/data/raw/dataset_pou) (4.626 Baris Panel Master)

| No | Nama Visualisasi | Tipe Plot | Library | Metode Statistik & Logika Perhitungan | Insight Storytelling |
|---|---|---|---|---|---|
| **3.1** | Tren Rata-rata & Median PoU Nasional | Line Plot dengan Area Pita | `matplotlib.pyplot` | - Mean, Median, dan Simpangan Baku tahunan 514 daerah (2017–2025)<br>- Anotasi lonjakan krisis pangan 2022 | Rerata PoU stabil di kisaran 11.4% (2017–2019), melonjak tajam ke titik puncak 13.75% pada 2022 akibat krisis energi dan pangan global, lalu membaik ke 10.75% pada 2025. |
| **3.2** | Distribusi & Outlier PoU Kabupaten/Kota | Boxplot Tahunan | `seaborn.boxplot` | - Deteksi titik pencilan atas (upper outliers) dari sebaran data 514 daerah | Memperlihatkan ekor data yang sangat panjang ke atas, di mana beberapa daerah mencapai ketidakcukupan konsumsi kalori di atas 60% sampai 80%. |
| **3.3** | Pergeseran Kurva Distribusi PoU | Overlapping Density Curves (KDE) | `seaborn.kdeplot` | - Estimasi kurva kepadatan kernel untuk tahun-tahun kunci: 2017, 2019, 2022, 2025 | Memperlihatkan kurva miring ke kanan secara ekstrem. Pada 2022 terlihat pelebaran kurva ke arah kanan yang menandakan pemburukan asupan gizi secara massal. |
| **3.4** | Proporsi Kategori Kerentanan PoU Standar FAO | 100% Stacked Bar Chart | `pandas.DataFrame.plot` | - Klasifikasi 5 kategori FAO:<br>Sangat Rendah (di bawah 5%), Rendah (5-10%), Sedang (10-20%), Tinggi (20-35%), Sangat Tinggi/Kritis (di atas 35%) | Pada krisis 2022, proporsi daerah kategori Sangat Rendah merosot drastis hingga sisa 8.37%, sebelum kembali pulih ke 17.70% pada tahun 2025. |
| **3.5** | 15 Kabupaten PoU Tertinggi vs Terendah 2025 | Paired Horizontal Bar Charts | `seaborn.barplot` | - Pemeringkatan nilai ekstrem kabupaten pada kondisi terkini tahun 2025 | Mengontraskan jurang ketimpangan kalori: daerah terbaik PoU di bawah 1.5% (kota di Jawa/Bali) vs daerah krisis PoU mencapai 40% sampai 59% (Papua). |
| **3.6** | Kisah Sukses vs Daerah Memburuk (Delta 9 Tahun) | Diverging Horizontal Bar Charts | `matplotlib.pyplot` | - Kalkulasi perubahan 9 tahun:<br>Delta PoU = PoU 2025 - PoU 2017 | Mengidentifikasi kisah sukses besar: Pegunungan Arfak (-38 poin) dan Tolikara (-22.7 poin), serta daerah waspada seperti Puncak (+34.9 poin) akibat gangguan keamanan wilayah. |

---

## Bagian V: Visualisasi pada Notebook 4 (EDA Dataset Provinsi FIES)
**Berkas Sumber:** [notebooks/04_EDA_Dataset_Provinsi_Kerawanan_Pangan.ipynb](file:///C:/Coding%20SDT/VS%20Code/Python/Semester%205/Presentasi%20dan%20Storytelling%20Data/Tugas%20Kelompok/notebooks/04_EDA_Dataset_Provinsi_Kerawanan_Pangan.ipynb)  
**Dataset:** 9 Berkas CSV Tahunan di [`data/raw/dataset_provinsi/`](file:///C:/Coding%20SDT/VS%20Code/Python/Semester%205/Presentasi%20dan%20Storytelling%20Data/Tugas%20Kelompok/data/raw/dataset_provinsi) (351 Baris)

| No | Nama Visualisasi | Tipe Plot | Library | Metode Statistik & Logika Perhitungan | Insight Storytelling |
|---|---|---|---|---|---|
| **4.1** | Tren Prevalensi Kerawanan Pangan FIES Nasional | Line Chart Benchmarking | `matplotlib.pyplot` | - Rata-rata nasional resmi BPS vs Rata-rata antar-provinsi (2017–2025) | Bukti keberhasilan bersejarah pencapaian target SDG 2.1.2: kerawanan pangan sedang atau berat terpangkas lebih dari separuh (-53.8%), dari 8.66% ke 4.00%. |
| **4.2** | Distribusi Kerawanan Pangan Antar-Provinsi | Boxplot Tahunan | `seaborn.boxplot` | - Ringkasan 5 angka sebaran data 38 provinsi dari tahun ke tahun | Rentang interkuartil (IQR) menyempit secara konsisten dari tahun ke tahun, mencerminkan adanya pemerataan perbaikan akses pangan antar-provinsi. |
| **4.3** | Peta Panas Prevalensi FIES 38 Provinsi | Matrix Heatmap Spasial-Temporal | `seaborn.heatmap` | - Matriks 38 Provinsi x 9 Tahun, diurutkan berdasarkan skor kerawanan tahun 2025 | Memperlihatkan transisi visual yang jelas dari dominasi warna merah tua pada 2017 menuju warna kuning/hijau muda pada 2025 di hampir seluruh provinsi. |
| **4.4** | Peringkat Prevalensi FIES Seluruh Provinsi 2025 | Full 38-Province Bar Chart | `matplotlib.pyplot` | - Barplot horizontal terurut lengkap dari terendah ke tertinggi dengan garis batas rata-rata nasional (4.00%) | Memberikan peta posisi komparatif setiap provinsi terhadap target nasional: Bali terendah (1.28%) dan NTT tertinggi (13.69%). |
| **4.5** | Distribusi Kerawanan Pangan Menurut Gugus Pulau | Boxplot Antar-Pulau | `seaborn.boxplot` | - Klasifikasi provinsi ke dalam 7 gugus kepulauan besar Indonesia | Maluku, Papua, dan Bali-Nusa Tenggara mencatatkan rata-rata kerawanan pangan berbasis pengalaman individu tertinggi. |
| **4.6** | Dinamika Penurunan FIES Antar-Kawasan | Multi-line Longitudinal Plot | `matplotlib.pyplot` | - Agregasi rata-rata tahunan per gugus kepulauan sepanjang 2017–2025 | Memperlihatkan bahwa akselerasi penurunan kerawanan pangan tercepat terjadi di Pulau Sulawesi dan Nusa Tenggara. |
| **4.7** | Akselerasi Penurunan Tercepat vs Stagnan | Paired Diverging Bar Charts | `matplotlib.pyplot` | - Perhitungan selisih 9 tahun:<br>Delta FIES = FIES 2025 - FIES 2017 | Menyoroti lompatan kemajuan spektakuler di Gorontalo (-14.21 poin) dan NTT (-13.85 poin), serta daerah stagnan seperti Papua Barat (+0.11 poin). |
| **4.8** | Kerawanan Pangan di 6 Provinsi Tanah Papua (DOB) | Grouped Bar Chart | `pandas.DataFrame.plot` | - Analisis komparatif 6 provinsi di Tanah Papua untuk data perdana 2024 vs 2025 | Membedah profil 4 DOB baru, di mana Papua Selatan (11.97%) dan Papua Barat (11.29%) menghadapi tingkat kerawanan pangan hampir tiga kali lipat rata-rata nasional. |

---

## Tabel Matriks Ringkasan Seluruh Metode

| Kategori Analisis | Metode Statistik & Komputasi yang Digunakan | Visualisasi yang Menerapkannya |
|---|---|---|
| **Agregasi Makro** | Mean (Rata-rata), Median, Sum, Proporsi Persentase Relatif, Delta Tahunan | Hero KPI Cards, Line Plots Tren Nasional (IKP, P0, PoU, FIES) |
| **Analisis Sebaran (Dispersi)** | Range (Maksimum - Minimum), Simpangan Baku (SD), Kuartil (Q1, Q3), Interquartile Range (IQR) | Kartu Kesenjangan, Boxplots Tahunan di Seluruh Notebook (IKP, P0, PoU, FIES) |
| **Kepadatan Probabilitas** | Kernel Density Estimation (KDE Gaussian) | Perbandingan Kabupaten vs Kota (IKP), Pergeseran Kurva Distribusi PoU |
| **Peringkat & Nilai Ekstrem** | Sorting Ascending/Descending, Extreme Slicing (Top dan Bottom N) | Chart 2 Dashboard, Peringkat Top/Bottom 10 dan 15 Daerah di 4 Notebook |
| **Korelasi Multivariat** | Koefisien Korelasi Pearson (r), Scatterplot Kuadran Kartesius | Chart 4 Dashboard, Matriks Korelasi Pilar (IKP), Scatterplot Delta Kemiskinan |
| **Analisis Spasial & Regional** | Pengelompokan Gugus Kepulauan (7 Region), Pemetaan Poligon GeoJSON | Peta Choropleth SVG Dashboard, Boxplot & Line Chart Antar-Pulau |
| **Segmentasi Kategori Baku** | Binning Interval Diskrit (Standar Bapanas 6 Kelompok & Standar FAO 5 Kategori) | 100% Stacked Bar Charts Proporsi Kerentanan (IKP dan PoU) |
| **Dekomposisi Dimensi** | Penguraian Sub-Indeks (Ketersediaan, Keterjangkauan, Pemanfaatan) | Chart 3 Dashboard, Analisis Pilar Ketahanan Pangan Notebook 1 |
| **Interaktivitas Antarmuka** | Cross-filtering Reaktif, Dynamic SVG Viewbox, Client-side Sorting & Pagination | Peta Interaktif Dashboard, Chart Scatter, Tabel Data Explorer |

---
*Dokumen ini disusun untuk melengkapi berkas presentasi dan laporan Tugas Kelompok Mata Kuliah Presentasi dan Storytelling Data.*
