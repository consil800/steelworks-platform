// 메인 페이지 JavaScript
document.addEventListener('DOMContentLoaded', function() {
    const searchRegionSelect = document.getElementById('searchRegion');
    const searchCompanyInput = document.getElementById('searchCompany');
    const searchBtn = document.getElementById('searchBtn');
    const addCompanyBtn = document.getElementById('addCompanyBtn');
    const exportBtn = document.getElementById('exportBtn');
    const importBtn = document.getElementById('importBtn');
    const deleteBtn = document.getElementById('deleteBtn');
    const xlsxFileInput = document.getElementById('xlsxFileInput');
    const companyList = document.getElementById('companyList');

    let isDeleteMode = false;
    let selectedCompanies = new Set();
    let searchState = {
        region: '',
        companyName: '',
        isFiltered: false
    };

    // 초기 데이터 로드
    loadCompanies();
    
    // 검색 상태 복원
    restoreSearchState();

    // 이벤트 리스너 등록
    searchBtn.addEventListener('click', handleSearch);
    addCompanyBtn.addEventListener('click', () => {
        saveSearchState();
        window.location.href = 'company-register.html';
    });
    exportBtn.addEventListener('click', exportCompanies);
    importBtn.addEventListener('click', () => xlsxFileInput.click());
    deleteBtn.addEventListener('click', handleDeleteMode);
    xlsxFileInput.addEventListener('change', importCompanies);

    // 지역 선택 시 자동 검색
    searchRegionSelect.addEventListener('change', function() {
        handleSearch();
    });

    searchCompanyInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            handleSearch();
        }
    });

    // 검색 처리 함수
    async function handleSearch() {
        const region = searchRegionSelect.value.trim();
        const companyName = searchCompanyInput.value.trim();

        // 검색 상태 업데이트
        searchState.region = region;
        searchState.companyName = companyName;
        searchState.isFiltered = !!(region || companyName);

        try {
            Utils.showLoading(companyList);
            
            let companies;
            if (region || companyName) {
                companies = await CompanyService.search(region, companyName);
            } else {
                companies = await CompanyService.getAll();
            }

            displayCompanies(companies);
        } catch (error) {
            Utils.showError('검색 중 오류가 발생했습니다: ' + error.message);
            companyList.innerHTML = '';
        }
    }

    // 모든 회사 로드
    async function loadCompanies() {
        try {
            Utils.showLoading(companyList);
            const companies = await CompanyService.getAll();
            displayCompanies(companies);
        } catch (error) {
            Utils.showError('데이터 로드 중 오류가 발생했습니다: ' + error.message);
            companyList.innerHTML = '';
        }
    }

    // 회사 목록 표시
    async function displayCompanies(companies) {
        // 업체 개수 업데이트
        const companyCountElement = document.getElementById('companyCount');
        if (companyCountElement) {
            companyCountElement.textContent = `(${companies ? companies.length : 0}개)`;
        }

        if (!companies || companies.length === 0) {
            companyList.innerHTML = '<tr><td colspan="' + (isDeleteMode ? '8' : '7') + '" style="text-align: center; padding: 20px; color: #666;">등록된 업체가 없습니다. 새 업체를 등록해보세요.</td></tr>';
            return;
        }

        // 방문 기록 데이터 가져오기
        let workLogs = [];
        try {
            if (window.WorkLogService && WorkLogService.getAll) {
                workLogs = await WorkLogService.getAll();
            } else {
                // 로컬 저장소에서 직접 호출
                workLogs = localStorageManager.getWorkLogs();
            }
        } catch (error) {
            console.warn('방문 기록을 가져올 수 없습니다:', error);
        }

        // 각 업체별 방문 통계 계산
        const companiesWithStats = companies.map(company => {
            const companyLogs = workLogs.filter(log => log.company_id === company.id);
            const visitCount = companyLogs.length;
            
            console.log(`업체 ${company.company_name}: 전체 로그 ${workLogs.length}개, 해당 업체 로그 ${visitCount}개`);
            console.log('업체 ID:', company.id);
            console.log('해당 로그들:', companyLogs);
            
            // 최근 방문일 찾기
            let lastVisitDate = null;
            if (companyLogs.length > 0) {
                const sortedLogs = companyLogs.sort((a, b) => new Date(b.visit_date) - new Date(a.visit_date));
                lastVisitDate = sortedLogs[0].visit_date;
            }

            return {
                ...company,
                visitCount,
                lastVisitDate
            };
        });

        const html = companiesWithStats.map(company => `
            <tr class="company-row ${company.company_color ? `color-${company.company_color}` : ''}" onclick="${isDeleteMode ? '' : `goToCompanyDetail('${company.id}')`}">
                ${isDeleteMode ? `
                    <td>
                        <input type="checkbox" class="company-checkbox" value="${company.id}" 
                               onchange="toggleCompanySelection('${company.id}', this.checked)"
                               onclick="event.stopPropagation()">
                    </td>
                ` : ''}
                <td>
                    ${company.company_color ? `<span class="color-indicator"></span>` : ''}
                    <span class="company-name">
                        ${company.company_name || '미입력'}
                    </span>
                </td>
                <td>${company.address || '미입력'}</td>
                <td>${company.contact_person || '미입력'}</td>
                <td>${company.phone || '미입력'}</td>
                <td>${company.business_type || '미입력'}</td>
                <td class="visit-count">${company.visitCount || 0}</td>
                <td class="last-visit">${company.company_color === 'gray' ? '-' : (company.lastVisitDate ? formatDate(company.lastVisitDate) + '일' : '방문기록 없음')}</td>
            </tr>
        `).join('');

        companyList.innerHTML = html;
        
        // 정렬용 데이터 저장
        companiesData = companiesWithStats;
    }

    // 날짜 차이 계산 (경과 일수)
    function formatDate(dateString) {
        if (!dateString) return null;
        
        const visitDate = new Date(dateString);
        const today = new Date();
        
        // 시간 정보를 제거하고 날짜만 비교
        const visitDateOnly = new Date(visitDate.getFullYear(), visitDate.getMonth(), visitDate.getDate());
        const todayOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        
        const diffTime = todayOnly - visitDateOnly;
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        
        return diffDays;
    }

    // WorkLogService는 local-storage.js에서 정의됨

    // 회사 상세 페이지로 이동
    window.goToCompanyDetail = function(companyId) {
        if (!isDeleteMode) {
            saveSearchState();
            window.location.href = `company-detail.html?id=${companyId}`;
        }
    };
    
    // 검색 상태 저장
    function saveSearchState() {
        sessionStorage.setItem('searchState', JSON.stringify(searchState));
    }
    
    // 검색 상태 복원
    function restoreSearchState() {
        const savedState = sessionStorage.getItem('searchState');
        if (savedState) {
            try {
                searchState = JSON.parse(savedState);
                
                // 입력 필드에 값 복원
                searchRegionInput.value = searchState.region || '';
                searchCompanyInput.value = searchState.companyName || '';
                
                // 필터가 있는 경우 검색 수행
                if (searchState.isFiltered) {
                    handleSearch();
                }
                
                // 세션 스토리지 정리
                sessionStorage.removeItem('searchState');
            } catch (error) {
                console.error('검색 상태 복원 실패:', error);
            }
        }
    }

    // 삭제 모드 토글
    function handleDeleteMode() {
        if (!isDeleteMode) {
            // 삭제 모드 진입
            isDeleteMode = true;
            deleteBtn.textContent = '삭제 실행';
            deleteBtn.className = 'btn btn-danger';
            
            // 테이블에 삭제 모드 클래스 추가
            const table = document.getElementById('companyTable');
            table.classList.add('delete-mode');
            
            // 헤더에 체크박스 컬럼 추가
            const headerRow = table.querySelector('thead tr');
            const checkboxHeader = document.createElement('th');
            checkboxHeader.innerHTML = '<input type="checkbox" id="selectAll" onchange="toggleSelectAll(this.checked)">';
            headerRow.insertBefore(checkboxHeader, headerRow.firstChild);
            
            // 회사 목록 다시 표시
            loadCompanies();
            
            Utils.showSuccess('삭제할 업체를 선택하세요. 다시 삭제 버튼을 누르면 선택된 업체들이 삭제됩니다.');
        } else {
            // 삭제 실행
            if (selectedCompanies.size === 0) {
                Utils.showError('삭제할 업체를 선택해주세요.');
                return;
            }
            
            const selectedIds = Array.from(selectedCompanies);
            const confirmMessage = `선택된 ${selectedCompanies.size}개 업체를 정말로 삭제하시겠습니까?\n\n삭제될 업체:\n${selectedIds.map(id => {
                const row = document.querySelector(`input[value="${id}"]`);
                if (row) {
                    const companyName = row.closest('tr').querySelector('.company-name').textContent;
                    return `- ${companyName}`;
                }
                return `- ID: ${id}`;
            }).join('\n')}\n\n⚠️ 삭제된 업체의 업무일지도 함께 삭제되며, 이 작업은 되돌릴 수 없습니다.`;
            
            if (confirm(confirmMessage)) {
                deleteSelectedCompanies();
            }
        }
    }

    // 업체 선택/해제
    window.toggleCompanySelection = function(companyId, isSelected) {
        if (isSelected) {
            selectedCompanies.add(companyId);
        } else {
            selectedCompanies.delete(companyId);
        }
        
        // 전체 선택 체크박스 상태 업데이트
        const selectAllCheckbox = document.getElementById('selectAll');
        const allCheckboxes = document.querySelectorAll('.company-checkbox');
        const checkedCheckboxes = document.querySelectorAll('.company-checkbox:checked');
        
        if (checkedCheckboxes.length === allCheckboxes.length) {
            selectAllCheckbox.checked = true;
            selectAllCheckbox.indeterminate = false;
        } else if (checkedCheckboxes.length === 0) {
            selectAllCheckbox.checked = false;
            selectAllCheckbox.indeterminate = false;
        } else {
            selectAllCheckbox.checked = false;
            selectAllCheckbox.indeterminate = true;
        }
    };

    // 전체 선택/해제
    window.toggleSelectAll = function(isSelected) {
        const checkboxes = document.querySelectorAll('.company-checkbox');
        selectedCompanies.clear();
        
        checkboxes.forEach(checkbox => {
            checkbox.checked = isSelected;
            if (isSelected) {
                selectedCompanies.add(checkbox.value);
            }
        });
    };

    // 선택된 업체들 삭제
    async function deleteSelectedCompanies() {
        try {
            deleteBtn.disabled = true;
            deleteBtn.textContent = '삭제 중...';
            
            const companyIds = Array.from(selectedCompanies);
            let successCount = 0;
            let errorCount = 0;
            
            // 각 업체를 개별적으로 삭제
            for (const companyId of companyIds) {
                try {
                    await CompanyService.delete(companyId);
                    successCount++;
                } catch (error) {
                    errorCount++;
                    console.error(`업체 ${companyId} 삭제 실패:`, error);
                }
            }
            
            if (successCount > 0) {
                Utils.showSuccess(`${successCount}개 업체가 성공적으로 삭제되었습니다.`);
                if (errorCount > 0) {
                    Utils.showError(`${errorCount}개 업체 삭제에 실패했습니다.`);
                }
            } else {
                Utils.showError('모든 업체 삭제에 실패했습니다.');
            }
            
            // 삭제 모드 종료
            exitDeleteMode();
            
            // 목록 새로고침
            loadCompanies();
            
        } catch (error) {
            Utils.showError('업체 삭제 중 오류가 발생했습니다: ' + error.message);
        } finally {
            deleteBtn.disabled = false;
            deleteBtn.textContent = '삭제';
        }
    }

    // 삭제 모드 종료
    function exitDeleteMode() {
        isDeleteMode = false;
        selectedCompanies.clear();
        
        deleteBtn.textContent = '삭제';
        deleteBtn.className = 'btn btn-warning';
        deleteBtn.disabled = false;
        
        // 테이블에서 삭제 모드 클래스 제거
        const table = document.getElementById('companyTable');
        table.classList.remove('delete-mode');
        
        // 헤더에서 체크박스 컬럼 제거
        const headerRow = table.querySelector('thead tr');
        const checkboxHeader = headerRow.querySelector('th:first-child');
        if (checkboxHeader && checkboxHeader.querySelector('#selectAll')) {
            headerRow.removeChild(checkboxHeader);
        }
    }

    // 정렬 상태 저장
    let currentSortColumn = -1;
    let sortDirection = 'asc';
    let companiesData = [];

    // 테이블 정렬 함수
    window.sortTable = function(columnIndex) {
        // 삭제 모드에서는 정렬 비활성화
        if (isDeleteMode) return;
        
        const table = document.getElementById('companyTable');
        const headers = table.querySelectorAll('th.sortable');
        
        // 기존 정렬 클래스 제거
        headers.forEach(header => {
            header.classList.remove('asc', 'desc');
        });

        // 정렬 방향 결정
        if (currentSortColumn === columnIndex) {
            sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
        } else {
            sortDirection = 'asc';
        }
        
        currentSortColumn = columnIndex;
        
        // 헤더에 정렬 클래스 추가
        headers[columnIndex].classList.add(sortDirection);

        // 데이터 정렬
        const sortedCompanies = [...companiesData].sort((a, b) => {
            let aValue, bValue;
            
            switch(columnIndex) {
                case 0: // 업체명
                    aValue = (a.company_name || '').toLowerCase();
                    bValue = (b.company_name || '').toLowerCase();
                    break;
                case 1: // 주소
                    aValue = (a.address || '').toLowerCase();
                    bValue = (b.address || '').toLowerCase();
                    break;
                case 2: // 담당자
                    aValue = (a.contact_person || '').toLowerCase();
                    bValue = (b.contact_person || '').toLowerCase();
                    break;
                case 3: // 전화번호
                    aValue = (a.phone || '').toLowerCase();
                    bValue = (b.phone || '').toLowerCase();
                    break;
                case 4: // 업종
                    aValue = (a.business_type || '').toLowerCase();
                    bValue = (b.business_type || '').toLowerCase();
                    break;
                case 5: // 방문횟수
                    aValue = a.visitCount || 0;
                    bValue = b.visitCount || 0;
                    return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
                case 6: // 최근방문일
                    // 회색 업체는 정렬에서 제외하고 맨 뒤로
                    if (a.company_color === 'gray' && b.company_color === 'gray') return 0;
                    if (a.company_color === 'gray') return sortDirection === 'asc' ? 1 : -1;
                    if (b.company_color === 'gray') return sortDirection === 'asc' ? -1 : 1;
                    
                    aValue = a.lastVisitDate ? new Date(a.lastVisitDate) : new Date(0);
                    bValue = b.lastVisitDate ? new Date(b.lastVisitDate) : new Date(0);
                    return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
                default:
                    return 0;
            }
            
            // 문자열 비교
            if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
            if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
            return 0;
        });

        // 정렬된 데이터로 테이블 다시 렌더링
        renderSortedCompanies(sortedCompanies);
    };

    // 정렬된 업체 목록 렌더링
    function renderSortedCompanies(companies) {
        const html = companies.map(company => `
            <tr class="company-row ${company.company_color ? `color-${company.company_color}` : ''}" onclick="${isDeleteMode ? '' : `goToCompanyDetail('${company.id}')`}">
                ${isDeleteMode ? `
                    <td>
                        <input type="checkbox" class="company-checkbox" value="${company.id}" 
                               onchange="toggleCompanySelection('${company.id}', this.checked)"
                               onclick="event.stopPropagation()">
                    </td>
                ` : ''}
                <td>
                    ${company.company_color ? `<span class="color-indicator"></span>` : ''}
                    <span class="company-name">
                        ${company.company_name || '미입력'}
                    </span>
                </td>
                <td>${company.address || '미입력'}</td>
                <td>${company.contact_person || '미입력'}</td>
                <td>${company.phone || '미입력'}</td>
                <td>${company.business_type || '미입력'}</td>
                <td class="visit-count">${company.visitCount || 0}</td>
                <td class="last-visit">${company.company_color === 'gray' ? '-' : (company.lastVisitDate ? formatDate(company.lastVisitDate) + '일' : '방문기록 없음')}</td>
            </tr>
        `).join('');

        companyList.innerHTML = html;
    }

    // 업체 목록 XLSX 내보내기 함수
    async function exportCompanies() {
        try {
            const companies = await CompanyService.getAll();

            // SheetJS 라이브러리가 로드되었는지 확인
            if (typeof XLSX === 'undefined') {
                // CDN에서 동적으로 로드
                await loadXLSXLibrary();
            }

            // XLSX 데이터 준비 - 헤더만 포함 (템플릿)
            const worksheet_data = [
                // 헤더
                ['업체명', '지역', '주소', '전화번호', '담당자', '휴대폰', '이메일', '결제조건', '채권금액', '업종', '제조품', '사용품목', '메모', '색상']
            ];

            // 업체 데이터가 있는 경우에만 추가
            if (companies && companies.length > 0) {
                companies.forEach(company => {
                    worksheet_data.push([
                        company.company_name || '',
                        company.region || '',
                        company.address || '',
                        company.phone || '',
                        company.contact_person || '',
                        company.mobile || '',
                        company.email || '',
                        company.payment_terms || '',
                        company.debt_amount || '',
                        company.business_type || '',
                        company.products || '',
                        company.usage_items || '',
                        company.notes || '',
                        company.company_color || ''
                    ]);
                });
            }

            // 워크시트 생성
            const ws = XLSX.utils.aoa_to_sheet(worksheet_data);
            
            // 컬럼 너비 설정
            const wscols = [
                {wch: 20}, // 업체명
                {wch: 15}, // 지역
                {wch: 30}, // 주소
                {wch: 15}, // 전화번호
                {wch: 15}, // 담당자
                {wch: 15}, // 휴대폰
                {wch: 20}, // 이메일
                {wch: 15}, // 결제조건
                {wch: 15}, // 채권금액
                {wch: 15}, // 업종
                {wch: 20}, // 제조품
                {wch: 20}, // 사용품목
                {wch: 30}, // 메모
                {wch: 10}  // 색상
            ];
            ws['!cols'] = wscols;

            // 워크북 생성
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, "업체목록");

            // 파일 다운로드
            const filename = `업체목록.xlsx`;
            XLSX.writeFile(wb, filename);

            // 성공 메시지 표시 (업체가 있을 때만)
            if (companies && companies.length > 0) {
                Utils.showSuccess('업체 목록을 성공적으로 내보냈습니다.');
            }
            // 업체가 없을 때는 조용히 템플릿만 다운로드
        } catch (error) {
            Utils.showError('내보내기 중 오류가 발생했습니다: ' + error.message);
        }
    }

    // XLSX 라이브러리 동적 로드
    function loadXLSXLibrary() {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js';
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }

    // 업체 목록 XLSX 불러오기 함수
    async function importCompanies(event) {
        const file = event.target.files[0];
        if (!file) return;

        const fileExtension = file.name.toLowerCase().split('.').pop();
        if (fileExtension !== 'xlsx' && fileExtension !== 'xls') {
            Utils.showError('XLSX 또는 XLS 파일만 업로드 가능합니다.');
            return;
        }

        try {
            // SheetJS 라이브러리가 로드되었는지 확인
            if (typeof XLSX === 'undefined') {
                await loadXLSXLibrary();
            }

            const data = await readFileAsArrayBuffer(file);
            const workbook = XLSX.read(data, { type: 'array' });
            
            // 첫 번째 시트 사용
            const worksheet = workbook.Sheets[workbook.SheetNames[0]];
            const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
            
            if (jsonData.length < 2) {
                Utils.showError('유효한 데이터가 없습니다. 최소 헤더와 1개 이상의 데이터 행이 필요합니다.');
                return;
            }

            // 헤더 제거
            const dataRows = jsonData.slice(1);
            let successCount = 0;
            let errorCount = 0;

            for (const row of dataRows) {
                try {
                    // 업체명이 있는 행만 처리
                    if (row[0] && row[0].toString().trim()) {
                        const companyData = {
                            company_name: row[0] ? row[0].toString().trim() : '',
                            region: row[1] ? row[1].toString().trim() : '',
                            address: row[2] ? row[2].toString().trim() : '',
                            phone: row[3] ? row[3].toString().trim() : '',
                            contact_person: row[4] ? row[4].toString().trim() : '',
                            mobile: row[5] ? row[5].toString().trim() : '',
                            email: row[6] ? row[6].toString().trim() : '',
                            payment_terms: row[7] ? row[7].toString().trim() : '',
                            debt_amount: row[8] ? row[8].toString().trim() : '',
                            business_type: row[9] ? row[9].toString().trim() : '',
                            products: row[10] ? row[10].toString().trim() : '',
                            usage_items: row[11] ? row[11].toString().trim() : '',
                            notes: row[12] ? row[12].toString().trim() : '',
                            company_color: row[13] ? row[13].toString().trim() : null
                        };

                        console.log('업체 데이터 생성 시도:', companyData);
                        await CompanyService.create(companyData);
                        successCount++;
                    }
                } catch (error) {
                    errorCount++;
                    console.error('업체 추가 실패:', error);
                }
            }

            // 결과 메시지
            if (successCount > 0) {
                Utils.showSuccess(`${successCount}개 업체를 성공적으로 불러왔습니다.`);
                if (errorCount > 0) {
                    Utils.showError(`${errorCount}개 업체 불러오기에 실패했습니다.`);
                }
                // 목록 새로고침
                loadCompanies();
            } else {
                Utils.showError('업체를 불러오는데 실패했습니다.');
            }

        } catch (error) {
            console.error('XLSX 불러오기 전체 오류:', error);
            Utils.showError('파일 읽기 중 오류가 발생했습니다: ' + error.message);
        }

        // 파일 입력 초기화
        xlsxFileInput.value = '';
    }

    // 파일을 ArrayBuffer로 읽기
    function readFileAsArrayBuffer(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (event) => resolve(event.target.result);
            reader.onerror = (error) => reject(error);
            reader.readAsArrayBuffer(file);
        });
    }

    // 테스트용 샘플 데이터 생성 함수 (디버그용)
    window.createTestData = async function() {
        try {
            const testCompany = {
                company_name: '테스트업체',
                region: '서울',
                address: '서울시 강남구',
                phone: '02-1234-5678',
                contact_person: '김철수',
                email: 'test@test.com',
                business_type: '제조업',
                notes: '테스트 업체입니다'
            };
            
            await CompanyService.create(testCompany);
            Utils.showSuccess('테스트 업체가 생성되었습니다.');
            loadCompanies();
        } catch (error) {
            console.error('테스트 데이터 생성 오류:', error);
            Utils.showError('테스트 데이터 생성 실패: ' + error.message);
        }
    };
});