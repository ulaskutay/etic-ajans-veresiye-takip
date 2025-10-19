// Basit Uyarı Sistemi - Simple Alert System

// Uyarı verileri - güvenli tanımlama
if (typeof window.alerts === 'undefined') {
    window.alerts = [];
}
if (typeof window.alertTriggers === 'undefined') {
    window.alertTriggers = [];
}

// Local referanslar
let alerts = window.alerts;
let alertTriggers = window.alertTriggers;

// Uyarıları yükle
async function loadAlerts() {
    try {
        alerts = await window.ipcRenderer.invoke('get-alerts');
        alertTriggers = await window.ipcRenderer.invoke('get-alert-triggers');
        updateAlertDisplay();
    } catch (error) {
        console.error('Uyarılar yüklenirken hata:', error);
    }
}

// Uyarı ekranını güncelle
function updateAlertDisplay() {
    const container = document.getElementById('alert-management-content');
    if (!container) return;

    container.innerHTML = `
        <div style="padding: 20px;">
            <!-- Başlık ve İstatistikler -->
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                <div>
                    <h3 style="margin: 0; color: #1e293b;">🚨 Uyarılar</h3>
                    <p style="margin: 5px 0 0 0; color: #64748b; font-size: 14px;">
                        ${alerts.length} aktif uyarı • ${alertTriggers.length} tetiklenen uyarı
                    </p>
                </div>
                <button onclick="showAddAlertForm()" 
                        style="background: #3b82f6; color: white; border: none; padding: 10px 20px; border-radius: 8px; cursor: pointer; font-weight: 500;">
                    ➕ Yeni Uyarı
                </button>
            </div>

            <!-- Uyarı Listesi -->
            <div style="background: white; border-radius: 12px; border: 1px solid #e2e8f0; overflow: hidden;">
                <div style="padding: 16px; border-bottom: 1px solid #e2e8f0; background: #f8fafc;">
                    <h4 style="margin: 0; color: #374151;">Aktif Uyarılar</h4>
                </div>
                <div style="max-height: 400px; overflow-y: auto;">
                    ${createAlertList()}
                </div>
            </div>

            <!-- Tetiklenen Uyarılar -->
            ${alertTriggers.length > 0 ? `
            <div style="background: white; border-radius: 12px; border: 1px solid #e2e8f0; overflow: hidden; margin-top: 20px;">
                <div style="padding: 16px; border-bottom: 1px solid #e2e8f0; background: #fef2f2;">
                    <h4 style="margin: 0; color: #dc2626;">🔴 Tetiklenen Uyarılar</h4>
                </div>
                <div style="max-height: 300px; overflow-y: auto;">
                    ${createTriggerList()}
                </div>
            </div>
            ` : ''}
        </div>
    `;
}

// Uyarı listesi oluştur
function createAlertList() {
    if (alerts.length === 0) {
        return `
            <div style="padding: 40px; text-align: center; color: #64748b;">
                <div style="font-size: 48px; margin-bottom: 16px;">📋</div>
                <h4 style="margin: 0 0 8px 0; color: #374151;">Henüz uyarı yok</h4>
                <p style="margin: 0; font-size: 14px;">İlk uyarınızı oluşturmak için "Yeni Uyarı" butonuna tıklayın.</p>
            </div>
        `;
    }

    return alerts.map(alert => `
        <div style="padding: 16px; border-bottom: 1px solid #f1f5f9; display: flex; justify-content: space-between; align-items: center;">
            <div style="flex: 1;">
                <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px;">
                    <span style="font-weight: 600; color: #1e293b;">${alert.name}</span>
                    <span style="background: ${getPriorityColor(alert.priority)}; color: white; padding: 2px 8px; border-radius: 12px; font-size: 12px; font-weight: 500;">
                        ${getPriorityText(alert.priority)}
                    </span>
                </div>
                <p style="margin: 0; color: #64748b; font-size: 14px;">
                    ${alert.description || 'Açıklama yok'}
                </p>
                <div style="margin-top: 8px; font-size: 12px; color: #94a3b8;">
                    ${getAlertTypeText(alert.alert_type)} • ${alert.condition_type} ${alert.condition_value}
                </div>
            </div>
            <div style="display: flex; gap: 8px;">
                <button onclick="editAlert(${alert.id})" 
                        style="background: #f1f5f9; border: 1px solid #e2e8f0; color: #374151; padding: 6px 12px; border-radius: 6px; cursor: pointer; font-size: 12px;">
                    ✏️ Düzenle
                </button>
                <button onclick="deleteAlert(${alert.id})" 
                        style="background: #fef2f2; border: 1px solid #fecaca; color: #dc2626; padding: 6px 12px; border-radius: 6px; cursor: pointer; font-size: 12px;">
                    🗑️ Sil
                </button>
            </div>
        </div>
    `).join('');
}

// Tetiklenen uyarı listesi oluştur
function createTriggerList() {
    return alertTriggers.filter(trigger => !trigger.is_resolved).map(trigger => `
        <div style="padding: 16px; border-bottom: 1px solid #f1f5f9;">
            <div style="display: flex; justify-content: space-between; align-items: start;">
                <div style="flex: 1;">
                    <div style="font-weight: 600; color: #dc2626; margin-bottom: 4px;">
                        ${trigger.alert_name || 'Bilinmeyen Uyarı'}
                    </div>
                    <div style="font-size: 14px; color: #64748b; margin-bottom: 8px;">
                        ${trigger.target_name || 'Hedef'} - Değer: ${trigger.trigger_value}
                    </div>
                    <div style="font-size: 12px; color: #94a3b8;">
                        ${new Date(trigger.triggered_at).toLocaleString('tr-TR')}
                    </div>
                </div>
                <button onclick="resolveTrigger(${trigger.id})" 
                        style="background: #10b981; color: white; border: none; padding: 6px 12px; border-radius: 6px; cursor: pointer; font-size: 12px;">
                    ✅ Çöz
                </button>
            </div>
        </div>
    `).join('');
}

// Yardımcı fonksiyonlar
function getPriorityColor(priority) {
    const colors = {
        'low': '#10b981',
        'medium': '#f59e0b', 
        'high': '#f97316',
        'critical': '#dc2626'
    };
    return colors[priority] || colors.medium;
}

function getPriorityText(priority) {
    const texts = {
        'low': 'Düşük',
        'medium': 'Orta',
        'high': 'Yüksek', 
        'critical': 'Kritik'
    };
    return texts[priority] || 'Orta';
}

function getAlertTypeText(type) {
    const texts = {
        'stock': '📦 Stok',
        'debt': '💰 Borç',
        'payment': '💳 Ödeme',
        'custom': '⚙️ Özel'
    };
    return texts[type] || '⚙️ Özel';
}

// Müşteri listesini yükle
async function loadCustomers() {
    try {
        customers = await window.electronAPI.getCustomers();
        return customers;
    } catch (error) {
        console.error('Müşteri yükleme hatası:', error);
        customers = [];
        return [];
    }
}

// Uyarı ekleme formu
async function showAddAlertForm() {
    // Müşteri listesini yükle
    await loadCustomers();
    const modalHtml = `
        <div id="add-alert-modal" class="modal active" onclick="if(event.target.id === 'add-alert-modal') closeModal('add-alert-modal')" style="z-index: 20000; transition: opacity 0.15s ease, transform 0.15s ease;">
            <div class="modal-content" style="max-width: 500px; transition: transform 0.15s ease;" onclick="event.stopPropagation()">
                <div class="modal-header">
                    <h2>➕ Yeni Uyarı</h2>
                    <button class="close-btn" onclick="closeModal('add-alert-modal')">&times;</button>
                </div>
                <form onsubmit="handleAddAlert(event)" style="padding: 20px;">
                    <div style="margin-bottom: 16px;">
                        <label style="display: block; margin-bottom: 6px; font-weight: 500; color: #374151;">Uyarı Adı *</label>
                        <input type="text" name="name" required 
                               style="width: 100%; padding: 10px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 14px;">
                    </div>
                    
                    <div style="margin-bottom: 16px;">
                        <label style="display: block; margin-bottom: 6px; font-weight: 500; color: #374151;">Açıklama</label>
                        <textarea name="description" rows="3" 
                                  style="width: 100%; padding: 10px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 14px; resize: vertical;"></textarea>
                    </div>
                    
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px;">
                        <div>
                            <label style="display: block; margin-bottom: 6px; font-weight: 500; color: #374151;">Tip *</label>
                            <select name="alert_type" required 
                                    style="width: 100%; padding: 10px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 14px;">
                                <option value="">Seçin</option>
                                <option value="stock">📦 Stok</option>
                                <option value="debt">💰 Borç</option>
                                <option value="payment">💳 Ödeme</option>
                            </select>
                        </div>
                        
                        <div>
                            <label style="display: block; margin-bottom: 6px; font-weight: 500; color: #374151;">Öncelik *</label>
                            <select name="priority" required 
                                    style="width: 100%; padding: 10px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 14px;">
                                <option value="medium">🟡 Orta</option>
                                <option value="low">🟢 Düşük</option>
                                <option value="high">🟠 Yüksek</option>
                                <option value="critical">🔴 Kritik</option>
                            </select>
                        </div>
                    </div>
                    
                    <div style="margin-bottom: 16px;">
                        <label style="display: block; margin-bottom: 6px; font-weight: 500; color: #374151;">Hedef *</label>
                        <select name="target_type" required onchange="updateTargetFields()"
                                style="width: 100%; padding: 10px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 14px;">
                            <option value="">Seçin</option>
                            <option value="all">🌐 Tümü</option>
                            <option value="customer">👤 Müşteri</option>
                        </select>
                    </div>
                    
                    <div id="customer-selection" style="margin-bottom: 16px; display: none;">
                        <label style="display: block; margin-bottom: 6px; font-weight: 500; color: #374151;">Müşteri Seçimi *</label>
                        <select name="target_id" 
                                style="width: 100%; padding: 10px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 14px;">
                            <option value="">Müşteri seçin</option>
                            ${customers.map(customer => 
                                `<option value="${customer.id}">${customer.name} ${customer.balance ? `(${customer.balance} TL)` : ''}</option>`
                            ).join('')}
                        </select>
                    </div>
                    
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px;">
                        <div>
                            <label style="display: block; margin-bottom: 6px; font-weight: 500; color: #374151;">Koşul *</label>
                            <select name="condition_type" required 
                                    style="width: 100%; padding: 10px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 14px;">
                                <option value="">Seçin</option>
                                <option value="less_than">Küçük</option>
                                <option value="greater_than">Büyük</option>
                                <option value="equals">Eşit</option>
                            </select>
                        </div>
                        
                        <div>
                            <label style="display: block; margin-bottom: 6px; font-weight: 500; color: #374151;">Değer *</label>
                            <input type="number" name="condition_value" required 
                                   style="width: 100%; padding: 10px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 14px;">
                        </div>
                    </div>
                    
                    <div style="display: flex; gap: 12px; justify-content: flex-end; margin-top: 24px;">
                        <button type="button" onclick="closeModal('add-alert-modal')" 
                                style="background: #f1f5f9; border: 1px solid #e2e8f0; color: #374151; padding: 10px 20px; border-radius: 6px; cursor: pointer;">
                            İptal
                        </button>
                        <button type="submit" 
                                style="background: #3b82f6; color: white; border: none; padding: 10px 20px; border-radius: 6px; cursor: pointer; font-weight: 500;">
                            Kaydet
                        </button>
                    </div>
                </form>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHtml);
}

// Hedef alanlarını güncelle
function updateTargetFields() {
    const targetType = document.querySelector('select[name="target_type"]').value;
    const customerSelection = document.getElementById('customer-selection');
    const targetIdSelect = document.querySelector('select[name="target_id"]');
    
    if (targetType === 'customer') {
        customerSelection.style.display = 'block';
        targetIdSelect.required = true;
    } else {
        customerSelection.style.display = 'none';
        targetIdSelect.required = false;
        targetIdSelect.value = '';
    }
}

// Uyarı ekleme işlemi
async function handleAddAlert(event) {
    event.preventDefault();
    
    const formData = new FormData(event.target);
    const alertData = {
        name: formData.get('name'),
        description: formData.get('description'),
        alert_type: formData.get('alert_type'),
        condition_type: formData.get('condition_type'),
        condition_value: formData.get('condition_value'),
        condition_field: 'balance', // Borç için balance kullan
        target_type: formData.get('target_type'),
        target_id: formData.get('target_id') || null,
        priority: formData.get('priority'),
        notification_method: 'popup'
    };
    
    try {
        await window.ipcRenderer.invoke('add-alert', alertData);
        showNotification('Uyarı başarıyla eklendi', 'success');
        closeModal('add-alert-modal');
        await loadAlerts();
    } catch (error) {
        console.error('Uyarı eklenirken hata:', error);
        showNotification('Uyarı eklenirken hata oluştu', 'error');
    }
}

// Uyarı düzenleme
function editAlert(alertId) {
    const alert = alerts.find(a => a.id === alertId);
    if (!alert) return;
    
    showNotification('Düzenleme özelliği yakında eklenecek', 'info');
}

// Uyarı silme
async function deleteAlert(alertId) {
    if (!confirm('Bu uyarıyı silmek istediğinizden emin misiniz?')) return;
    
    try {
        await window.ipcRenderer.invoke('delete-alert', alertId);
        showNotification('Uyarı silindi', 'success');
        await loadAlerts();
    } catch (error) {
        console.error('Uyarı silinirken hata:', error);
        showNotification('Uyarı silinirken hata oluştu', 'error');
    }
}

// Tetiklenen uyarıyı çöz
async function resolveTrigger(triggerId) {
    try {
        await window.ipcRenderer.invoke('resolve-alert-trigger', triggerId);
        showNotification('Uyarı çözüldü', 'success');
        await loadAlerts();
    } catch (error) {
        console.error('Uyarı çözülürken hata:', error);
        showNotification('Uyarı çözülürken hata oluştu', 'error');
    }
}

// Modal kapatma
function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        // Modal'ı yavaşça kapat
        modal.style.opacity = '0';
        modal.style.transform = 'scale(0.95)';
        
        setTimeout(() => {
            modal.remove();
        }, 150);
    }
}

// Bildirim göster
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'success' ? '#10b981' : type === 'error' ? '#dc2626' : '#3b82f6'};
        color: white;
        padding: 12px 20px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 10000;
        font-weight: 500;
        max-width: 300px;
    `;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

// Uyarı yönetimi modalını göster
async function showAlertManagement() {
    const modalHtml = `
        <div id="alert-management-modal" class="modal active" onclick="if(event.target.id === 'alert-management-modal') closeAlertManagementModal()" style="z-index: 10000; transition: opacity 0.15s ease, transform 0.15s ease;">
            <div class="modal-content" style="max-width: 1000px; max-height: 90vh; overflow-y: auto; transition: transform 0.15s ease;" onclick="event.stopPropagation()">
                <div class="modal-header">
                    <h2>🚨 Uyarı Yönetimi</h2>
                    <button class="close-btn" onclick="closeAlertManagementModal()">&times;</button>
                </div>
                <div id="alert-management-content">
                    <!-- İçerik buraya yüklenecek -->
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    await loadAlerts();
}

// Uyarı yönetimi modalını kapat
function closeAlertManagementModal() {
    const modal = document.getElementById('alert-management-modal');
    if (modal) {
        // Modal'ı yavaşça kapat
        modal.style.opacity = '0';
        modal.style.transform = 'scale(0.95)';
        
        setTimeout(() => {
            modal.remove();
        }, 150);
    }
}

// ESC tuşu ile kapanma
document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape') {
        const activeModal = document.querySelector('.modal.active');
        if (activeModal) {
            const modalId = activeModal.id;
            if (modalId === 'alert-management-modal') {
                closeAlertManagementModal();
            } else {
                closeModal(modalId);
            }
        }
    }
});