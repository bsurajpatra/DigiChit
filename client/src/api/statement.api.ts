import api from './axios';
import type {
    IMemberStatementData,
    IOrganizerStatementData,
    IStatementFilterParams
} from '../types/statement';

export const fetchMemberStatement = async (
    memberId: string,
    params?: IStatementFilterParams
): Promise<IMemberStatementData> => {
    const response = await api.get(`/statements/member/${memberId}`, { params });
    return response.data;
};

export const fetchOrganizerStatement = async (
    organizerId: string,
    params?: IStatementFilterParams
): Promise<IOrganizerStatementData> => {
    const response = await api.get(`/statements/organizer/${organizerId}`, { params });
    return response.data;
};

export const fetchGroupStatement = async (
    groupId: string,
    params?: IStatementFilterParams
) => {
    const response = await api.get(`/statements/group/${groupId}`, { params });
    return response.data;
};

export const downloadStatementCSV = async (params?: IStatementFilterParams) => {
    const response = await api.get('/statements/export', {
        params: { ...params, format: 'csv' },
        responseType: 'blob'
    });

    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Financial_Statement_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
};
