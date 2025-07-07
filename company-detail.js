// 업체 상세 페이지 JavaScript

let currentCompany = null;
let currentUser = null;

document.addEventListener('DOMContentLoaded', async function() {
    console.log('업체 상세 페이지 로드 시작');
    
    // 데이터베이스 초기화 대기
    await waitForDatabase();
    
    // 로그인 확인
    currentUser = AuthManager.getCurrentUser();
    if (!currentUser) {
        alert('로그인이 필요합니다.');
        window.location.href = 'login.html';
        return;
    }
    
    // URL에서 업체 ID 추출
    const urlParams = new URLSearchParams(window.location.search);
    const companyId = urlParams.get('id');
    
    if (!companyId) {
        alert('업체 ID가 없습니다.');
        window.location.href = 'worklog.html';
        return;
    }
    
    console.log('업체 ID:', companyId);
    
    // 업체 정보 로드
    await loadCompanyDetails(companyId);
    
    // 이벤트 리스너 등록
    initEventListeners();
});

// 데이터베이스 초기화 대기
async function waitForDatabase() {
    let retryCount = 0;
    while ((!window.db || !window.db.client) && retryCount < 50) {
        await new Promise(resolve => setTimeout(resolve, 100));
        retryCount++;
    }
    console.log('데이터베이스 초기화 상태:', !!window.db, !!window.db?.client);
}

// 업체 상세 정보 로드
async function loadCompanyDetails(companyId) {
    try {
        console.log('업체 정보 로드 시작, ID:', companyId);
        
        if (!window.db || !window.db.client) {
            throw new Error('데이터베이스 연결이 필요합니다.');
        }
        
        // 업체 정보 가져오기
        const companies = await window.db.getClientCompanies(currentUser.id);
        currentCompany = companies.find(c => c.id == companyId);
        
        if (!currentCompany) {
            throw new Error('업체를 찾을 수 없습니다.');
        }
        
        console.log('업체 정보 로드됨:', currentCompany);
        
        // 업체 정보 표시
        displayCompanyDetails(currentCompany);
        
    } catch (error) {
        console.error('업체 정보 로드 오류:', error);
        alert('업체 정보를 불러오는데 실패했습니다: ' + error.message);
        window.location.href = 'worklog.html';
    }
}

// 업체 정보 표시
function displayCompanyDetails(company) {
    // 제목 설정
    document.getElementById('companyTitle').textContent = company.company_name + ' - 상세정보';
    
    // 업체 정보 HTML 생성
    const companyDetails = document.getElementById('companyDetails');
    companyDetails.innerHTML = `
        <div class="info-item">
            <label>업체명:</label>
            <span>${company.company_name || '-'}</span>
        </div>
        <div class="info-item">
            <label>지역:</label>
            <span>${company.region || '-'}</span>
        </div>
        <div class="info-item">
            <label>주소:</label>
            <span>${company.address || '-'}</span>
        </div>
        <div class="info-item">
            <label>전화번호:</label>
            <span>${company.phone || '-'}</span>
        </div>
        <div class="info-item">
            <label>담당자:</label>
            <span>${company.contact_person || '-'}</span>
        </div>
        <div class="info-item">
            <label>휴대폰:</label>
            <span>${company.mobile || '-'}</span>
        </div>
        <div class="info-item">
            <label>이메일:</label>
            <span>${company.email || '-'}</span>
        </div>
        <div class="info-item">
            <label>결제조건:</label>
            <span>${company.payment_terms || '-'}</span>
        </div>
        <div class="info-item">
            <label>채권금액:</label>
            <span>${company.debt_amount || '-'}</span>
        </div>
        <div class="info-item">
            <label>업종:</label>
            <span>${company.business_type || '-'}</span>
        </div>
        <div class="info-item">
            <label>제조품:</label>
            <span>${company.products || '-'}</span>
        </div>
        <div class="info-item">
            <label>사용품목:</label>
            <span>${company.usage_items || '-'}</span>
        </div>
        <div class="info-item">
            <label>방문횟수:</label>
            <span>${company.visit_count || 0}회</span>
        </div>
        <div class="info-item">
            <label>최근방문일:</label>
            <span>${company.last_visit_date || '-'}</span>
        </div>
        <div class="info-item">
            <label>메모:</label>
            <span>${company.notes || '-'}</span>
        </div>
        <div class="info-item">
            <label>등록일:</label>
            <span>${new Date(company.created_at).toLocaleDateString() || '-'}</span>
        </div>
    `;
}

// 이벤트 리스너 초기화
function initEventListeners() {
    // 뒤로가기 버튼
    document.getElementById('backBtn').addEventListener('click', function() {
        window.location.href = 'worklog.html';
    });
    
    // 메인으로 버튼
    document.getElementById('backToMainBtn').addEventListener('click', function() {
        window.location.href = 'employee-dashboard.html';
    });
    
    // 업체 정보 수정 버튼
    document.getElementById('editCompanyBtn').addEventListener('click', function() {
        if (currentCompany) {
            populateEditForm(currentCompany);
            document.getElementById('editModal').style.display = 'block';
        }
    });
    
    // 업체 삭제 버튼
    document.getElementById('deleteCompanyBtn').addEventListener('click', function() {
        if (currentCompany) {
            deleteCompany(currentCompany.id);
        }
    });
    
    // 모달 닫기
    document.getElementById('closeModal').addEventListener('click', function() {
        document.getElementById('editModal').style.display = 'none';
    });
    
    // 수정 폼 제출
    document.getElementById('editCompanyForm').addEventListener('submit', function(e) {
        e.preventDefault();
        updateCompany();
    });
    
    // 새 일지 작성 버튼
    document.getElementById('newWorkLogBtn').addEventListener('click', function() {
        // 업무일지 작성 페이지로 이동 (구현 예정)
        alert('업무일지 작성 기능은 준비 중입니다.');
    });
}

// 수정 폼에 현재 정보 채우기
function populateEditForm(company) {
    document.getElementById('editCompanyName').value = company.company_name || '';
    document.getElementById('editRegion').value = company.region || '';
    document.getElementById('editAddress').value = company.address || '';
    document.getElementById('editPhone').value = company.phone || '';
    document.getElementById('editContactPerson').value = company.contact_person || '';
    document.getElementById('editMobile').value = company.mobile || '';
    document.getElementById('editEmail').value = company.email || '';
    document.getElementById('editPaymentTerms').value = company.payment_terms || '';
    document.getElementById('editDebtAmount').value = company.debt_amount || '';
    document.getElementById('editBusinessType').value = company.business_type || '';
    document.getElementById('editProducts').value = company.products || '';
    document.getElementById('editUsageItems').value = company.usage_items || '';
    document.getElementById('editNotes').value = company.notes || '';
}

// 업체 정보 수정
async function updateCompany() {
    try {
        const formData = new FormData(document.getElementById('editCompanyForm'));
        const updateData = {
            company_name: formData.get('editCompanyName').trim(),
            region: formData.get('editRegion').trim(),
            address: formData.get('editAddress').trim(),
            phone: formData.get('editPhone').trim(),
            contact_person: formData.get('editContactPerson').trim(),
            mobile: formData.get('editMobile').trim(),
            email: formData.get('editEmail').trim(),
            payment_terms: formData.get('editPaymentTerms').trim(),
            debt_amount: formData.get('editDebtAmount').trim(),
            business_type: formData.get('editBusinessType').trim(),
            products: formData.get('editProducts').trim(),
            usage_items: formData.get('editUsageItems').trim(),
            notes: formData.get('editNotes').trim()
        };
        
        if (!updateData.company_name) {
            alert('업체명을 입력해주세요.');
            return;
        }
        
        console.log('업체 정보 수정 시작:', updateData);
        
        const result = await window.db.updateClientCompany(currentCompany.id, updateData);
        
        if (result.success) {
            alert('업체 정보가 성공적으로 수정되었습니다.');
            document.getElementById('editModal').style.display = 'none';
            
            // 업체 정보 다시 로드
            await loadCompanyDetails(currentCompany.id);
        } else {
            throw new Error('업체 정보 수정에 실패했습니다.');
        }
        
    } catch (error) {
        console.error('업체 정보 수정 오류:', error);
        alert('업체 정보 수정 중 오류가 발생했습니다: ' + error.message);
    }
}

// 업체 삭제
async function deleteCompany(companyId) {
    if (!confirm(`'${currentCompany.company_name}' 업체를 정말로 삭제하시겠습니까?\n\n이 작업은 되돌릴 수 없습니다.`)) {
        return;
    }
    
    try {
        console.log('업체 삭제 시작:', companyId);
        
        const result = await window.db.deleteClientCompany(companyId);
        
        if (result.success) {
            alert('업체가 성공적으로 삭제되었습니다.');
            window.location.href = 'worklog.html';
        } else {
            throw new Error('업체 삭제에 실패했습니다.');
        }
        
    } catch (error) {
        console.error('업체 삭제 오류:', error);
        alert('업체 삭제 중 오류가 발생했습니다: ' + error.message);
    }
}